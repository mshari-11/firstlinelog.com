import json
import psycopg2
import os

def lambda_handler(event, context):
    sql = event.get('sql', '')
    if not sql:
        return {'statusCode': 400, 'body': 'No SQL provided'}
    
    conn = psycopg2.connect(
        host=os.environ.get('DB_HOST', 'fll-postgres-restored.c10u4c202tm8.me-south-1.rds.amazonaws.com'),
        port=int(os.environ.get('DB_PORT', '5432')),
        user=os.environ.get('DB_USER', 'postgres'),
        password=os.environ.get('DB_PASSWORD', ''),
        dbname=os.environ.get('DB_NAME', 'postgres'),
        connect_timeout=10
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    results = []
    errors = 0
    # Split by semicolons but handle multi-line statements
    statements = [s.strip() for s in sql.split(';') if s.strip() and not s.strip().startswith('--')]
    
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
            results.append({'i': i, 'sql': stmt[:100], 'error': str(e)})
            errors += 1
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200 if errors == 0 else 207,
        'body': json.dumps({
            'total': len(statements),
            'success': len(statements) - errors,
            'errors': errors,
            'results': results
        }, default=str)
    }
