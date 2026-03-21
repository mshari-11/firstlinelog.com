
"use strict";
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const REGION = process.env.AWS_REGION;
const BEDROCK_REGION = process.env.BEDROCK_REGION || "eu-west-2";
const MODEL_ID = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";
const COMPLAINTS_TABLE = process.env.COMPLAINTS_TABLE;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const brt = new BedrockRuntimeClient({ region: BEDROCK_REGION });

function safeJsonParse(s) { try { return JSON.parse(s); } catch { return null; } }

function buildPrompt(c) {
  const msg = (c.messages && c.messages[0] && c.messages[0].message) ? c.messages[0].message : "";
  return "Classify this logistics complaint. Return ONLY strict JSON: {\"type\":\"payout|orders|vehicle|contract|other\",\"department\":\"finance|operations|fleet|hr\",\"prioritySuggested\":\"low|normal|high|urgent\",\"sentiment\":\"neg|neu|pos\",\"summaryAr\":\"2 lines max\",\"confidence\":0.0}\nRules: payout/wallet/deduction/invoice->finance; vehicle/maintenance/accident/fuel->fleet; iqama/contract/policy->hr; else->operations.\nsubject:" + (c.subject||"") + "\ntype:" + (c.type||"") + "\ncity:" + (c.city||"") + "\nmessage:" + msg;
}

function extractJson(text) {
  const s = text.indexOf("{"), e = text.lastIndexOf("}");
  if (s >= 0 && e > s) return safeJsonParse(text.slice(s, e + 1));
  return null;
}

async function invokeNova(prompt) {
  const body = JSON.stringify({
    messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
    inferenceConfig: { max_new_tokens: 300, temperature: 0.1 }
  });
  const resp = await brt.send(new InvokeModelCommand({
    modelId: MODEL_ID, contentType: "application/json", accept: "application/json",
    body: Buffer.from(body)
  }));
  const raw = Buffer.from(resp.body).toString("utf8");
  const j = safeJsonParse(raw);
  if (j) {
    if (j.output && j.output.message && j.output.message.content)
      return j.output.message.content.map(c => c.text || "").join("");
    if (j.content) return j.content.map(c => c.text || "").join("");
    if (j.outputText) return j.outputText;
  }
  return raw;
}

exports.handler = async (event) => {
  for (const r of (event.Records || [])) {
    const msg = safeJsonParse(r.body) || {};
    const { complaintId } = msg;
    if (!complaintId) continue;
    const res = await ddb.send(new GetCommand({ TableName: COMPLAINTS_TABLE, Key: { complaintId } }));
    if (!res.Item) continue;
    const complaint = res.Item;
    let modelText = "";
    try { modelText = await invokeNova(buildPrompt(complaint)); }
    catch (e) { console.error("Bedrock error:", e?.message); throw e; }
    const ai = extractJson(modelText);
    const now = new Date().toISOString();
    const canRoute = complaint.status === "open" && !complaint.assignedTo && (!complaint.department || complaint.department === "operations");
    if (ai) {
      const upd = { ":ai": { ...ai, classifiedAt: now, modelId: MODEL_ID }, ":now": now };
      let expr = "SET ai = :ai, updatedAt = :now";
      if (canRoute && ai.department) { expr += ", department = :dep"; upd[":dep"] = String(ai.department).toLowerCase(); }
      await ddb.send(new UpdateCommand({ TableName: COMPLAINTS_TABLE, Key: { complaintId }, UpdateExpression: expr, ExpressionAttributeValues: upd }));
    } else {
      await ddb.send(new UpdateCommand({ TableName: COMPLAINTS_TABLE, Key: { complaintId }, UpdateExpression: "SET ai = :ai, updatedAt = :now", ExpressionAttributeValues: { ":ai": { raw: modelText.slice(0,500), parseError: true, classifiedAt: now }, ":now": now } }));
    }
    console.log("Classified:", complaintId, ai ? ai.department : "parse-error");
  }
  return { ok: true };
};
