/**
 * FLL AI Chat Widget v1.0
 * مساعد ذكي مصغر يظهر في أسفل الصفحة
 */
(function() {
  const API_URL = 'https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com/ai/chat';
  let conversationId = null;
  let history = [];
  let isOpen = false;

  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    #fll-chat-btn{position:fixed;bottom:24px;left:24px;width:60px;height:60px;border-radius:50%;background:#0f2744;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.3);z-index:9999;font-size:28px;display:flex;align-items:center;justify-content:center;transition:transform .2s}
    #fll-chat-btn:hover{transform:scale(1.1)}
    #fll-chat-box{position:fixed;bottom:96px;left:24px;width:380px;max-height:520px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.2);z-index:9999;display:none;flex-direction:column;overflow:hidden;font-family:'Tajawal',sans-serif;direction:rtl}
    #fll-chat-box.open{display:flex}
    #fll-chat-header{background:#0f2744;color:#fff;padding:14px 18px;display:flex;justify-content:space-between;align-items:center}
    #fll-chat-header h4{margin:0;font-size:15px;font-weight:700}
    #fll-chat-close{background:none;border:none;color:rgba(255,255,255,.7);cursor:pointer;font-size:20px}
    #fll-chat-messages{flex:1;overflow-y:auto;padding:16px;max-height:360px;min-height:200px}
    .fll-msg{margin-bottom:12px;display:flex}
    .fll-msg.user{justify-content:flex-start}
    .fll-msg.bot{justify-content:flex-end}
    .fll-msg-bubble{max-width:85%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.7;white-space:pre-wrap}
    .fll-msg.user .fll-msg-bubble{background:#0f2744;color:#fff;border-bottom-right-radius:4px}
    .fll-msg.bot .fll-msg-bubble{background:#f1f5f9;color:#1e293b;border-bottom-left-radius:4px}
    .fll-msg.bot .fll-msg-bubble strong,.fll-msg.bot .fll-msg-bubble b{font-weight:700}
    #fll-chat-input-wrap{padding:12px;border-top:1px solid #e2e8f0;display:flex;gap:8px}
    #fll-chat-input{flex:1;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;font-family:inherit;outline:none;direction:rtl}
    #fll-chat-input:focus{border-color:#0ea5e9}
    #fll-chat-send{background:#0f2744;color:#fff;border:none;border-radius:10px;padding:10px 16px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600}
    #fll-chat-send:disabled{opacity:.5;cursor:not-allowed}
    .fll-typing{display:flex;gap:4px;padding:6px 0}.fll-typing span{width:6px;height:6px;background:#94a3b8;border-radius:50%;animation:fll-dot .6s infinite alternate}
    .fll-typing span:nth-child(2){animation-delay:.2s}.fll-typing span:nth-child(3){animation-delay:.4s}
    @keyframes fll-dot{to{opacity:.3;transform:translateY(-4px)}}
    @media(max-width:480px){#fll-chat-box{left:8px;right:8px;width:auto;bottom:84px}}
  `;
  document.head.appendChild(style);

  // Create elements
  const btn = document.createElement('button');
  btn.id = 'fll-chat-btn';
  btn.innerHTML = '💬';
  btn.title = 'المساعد الذكي';
  document.body.appendChild(btn);

  const box = document.createElement('div');
  box.id = 'fll-chat-box';
  box.innerHTML = `
    <div id="fll-chat-header">
      <h4>🤖 المساعد الذكي — FLL</h4>
      <button id="fll-chat-close">✕</button>
    </div>
    <div id="fll-chat-messages">
      <div class="fll-msg bot"><div class="fll-msg-bubble">أهلاً! أنا المساعد الذكي لفيرست لاين لوجستيكس 🚚\nكيف أقدر أساعدك اليوم؟</div></div>
    </div>
    <div id="fll-chat-input-wrap">
      <button id="fll-chat-send">إرسال</button>
      <input id="fll-chat-input" placeholder="اكتب سؤالك هنا..." autocomplete="off">
    </div>
  `;
  document.body.appendChild(box);

  const msgs = document.getElementById('fll-chat-messages');
  const input = document.getElementById('fll-chat-input');
  const sendBtn = document.getElementById('fll-chat-send');

  btn.onclick = () => { isOpen = !isOpen; box.classList.toggle('open', isOpen); if(isOpen) input.focus(); };
  document.getElementById('fll-chat-close').onclick = () => { isOpen = false; box.classList.remove('open'); };

  function addMsg(text, role) {
    const d = document.createElement('div');
    d.className = 'fll-msg ' + role;
    d.innerHTML = '<div class="fll-msg-bubble">' + text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>') + '</div>';
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    const d = document.createElement('div');
    d.className = 'fll-msg bot';
    d.id = 'fll-typing';
    d.innerHTML = '<div class="fll-msg-bubble"><div class="fll-typing"><span></span><span></span><span></span></div></div>';
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  async function send() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendBtn.disabled = true;
    addMsg(text, 'user');
    showTyping();

    try {
      const userId = localStorage.getItem('fll_user_id') || 'anonymous';
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, user_id: userId, conversation_id: conversationId, history: history })
      });
      const data = await res.json();
      document.getElementById('fll-typing')?.remove();
      if (data.reply) {
        addMsg(data.reply, 'bot');
        conversationId = data.conversation_id;
        history.push({ role: 'user', content: text });
        history.push({ role: 'assistant', content: data.reply });
        if (history.length > 20) history = history.slice(-20);
      } else {
        addMsg('عذراً، حصل خطأ. حاول مرة ثانية.', 'bot');
      }
    } catch(e) {
      document.getElementById('fll-typing')?.remove();
      addMsg('عذراً، ما قدرت أتواصل مع الخادم. حاول لاحقاً.', 'bot');
    }
    sendBtn.disabled = false;
    input.focus();
  }

  sendBtn.onclick = send;
  input.onkeydown = (e) => { if (e.key === 'Enter') send(); };
})();
