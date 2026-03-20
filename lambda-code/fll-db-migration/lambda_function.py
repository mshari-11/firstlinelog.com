import json
import psycopg2
import os
import re
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Auth: require a secret token to execute migrations
MIGRATION_SECRET = os.environ.get('MIGRATION_SECRET', '')

# Only allow safe DDL/DML — block destructive operations
BLOCKED_PATTERNS = [
    r'\bDROP\s+DATABASE\b',
    r'\bDROP\s+SCHEMA\b.*\bCASCADE\b',
    r'\bTRUNCATE\b',
    r'\bDELETE\s+FROM\b(?!.*\bWHERE\b)',  # DELETE without WHERE
]

ALLOWED_PREFIXES = [
    'CREATE', 'ALTER', 'INSERT', 'UPDATE', 'SELECT',
    'DELETE',  # only with WHERE (checked above)
    'DROP TABLE', 'DROP INDEX', 'DROP VIEW',
    'COMMENT', 'GRANT', 'REVOKE',
    'CREATE INDEX', 'CREATE OR REPLACE',
]


def validate_statement(stmt):
    """Check if a SQL statement is allowed."""
    upper = stmt.upper().strip()

    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, upper):
            return False, f"Blocked: matches destructive pattern"

    for prefix in ALLOWED_PREFIXES:
        if upper.startswith(prefix):
            return True, "OK"

    return False, f"Not in allowlist: {upper[:30]}..."


def lambda_handler(event, context):
    # Auth check
    if not MIGRATION_SECRET:
        logger.error("MIGRATION_SECRET not configured")
        return {'statusCode': 500, 'body': json.dumps({'error': 'Migration service not configured'})}

    provided_secret = event.get('secret', '')
    if provided_secret != MIGRATION_SECRET:
        logger.warning("Unauthorized migration attempt")
        return {'statusCode': 403, 'body': json.dumps({'error': 'Unauthorized'})}

    sql = event.get('sql', '')
    if not sql:
        return {'statusCode': 400, 'body': json.dumps({'error': 'No SQL provided'})}

    # Validate all statements before executing any
    statements = [s.strip() for s in sql.split(';') if s.strip() and not s.strip().startswith('--')]

    for i, stmt in enumerate(statements):
        allowed, reason = validate_statement(stmt)
        if not allowed:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': f'Statement {i} rejected: {reason}'})
            }

    # Connect — no fallback values, require env vars
    db_host = os.environ.get('DB_HOST')
    db_password = os.environ.get('DB_PASSWORD')
    if not db_host or not db_password:
        logger.error("Database credentials not configured")
        return {'statusCode': 500, 'body': json.dumps({'error': 'Database not configured'})}

    conn = psycopg2.connect(
        host=db_host,
        port=int(os.environ.get('DB_PORT', '5432')),
        user=os.environ.get('DB_USER', 'postgres'),
        password=db_password,
        dbname=os.environ.get('DB_NAME', 'postgres'),
        connect_timeout=10
    )
    conn.autocommit = True
    cur = conn.cursor()

    results = []
    errors = 0

    for i, stmt in enumerate(statements):
        try:
            cur.execute(stmt)
            if cur.description:
                rows = cur.fetchall()
                cols = [d[0] for d in cur.description]
                results.append({'i': i, 'sql': stmt[:100], 'rows': [dict(zip(cols, r)) for r in rows[:20]], 'count': len(rows)})
            else:
                results.append({'i': i, 'sql': stmt[:100], 'ok': True, 'rows_affected': cur.rowcount})
        except Exception as e:
            logger.error(f"Statement {i} failed: {str(e)}")
            results.append({'i': i, 'sql': stmt[:100], 'error': 'Statement execution failed'})
            errors += 1

    cur.close()
    conn.close()

    logger.info(f"Migration completed: {len(statements)} statements, {errors} errors")

    return {
        'statusCode': 200 if errors == 0 else 207,
        'body': json.dumps({
            'total': len(statements),
            'success': len(statements) - errors,
            'errors': errors,
            'results': results
        }, default=str)
    }
