# SHIF-A AI Owner Security — हिंदी उपयोग गाइड

## मौजूदा implementation slice: Direct Passkey

### Passkey क्या करती है?
Passkey WebAuthn credential है। Device या password manager private key अपने पास रखता है। Login के समय browser cryptographic proof भेजता है। Fingerprint, face unlock या device PIN का चुनाव operating system करता है; SHIF-A को biometric image/template नहीं मिलता।

### Owner Direct Login
1. Owner Security page खोलें: `owner-security.html`.
2. **Direct Passkey Login** दबाएँ।
3. Android/Chrome के authenticator prompt को पूरा करें।
4. Login के बाद server `shif-a-access` से Owner role verify करता है।
5. Account Owner न होने पर session तुरंत sign out होती है।

### इस device पर passkey जोड़ना
1. पहले verified Owner account से सामान्य login करें।
2. Owner Security page खोलें।
3. **इस Device पर Passkey जोड़ें** दबाएँ।
4. Device prompt पूरा करें।
5. **मेरी Passkeys देखें** से registered credentials देखें।

### अभी जरूरी configuration
यह feature अभी Supabase project में enabled नहीं किया गया है। Project Dashboard → Authentication → Passkeys में enable करते समय:
- RP display name: `SHIF-A AI`
- RP ID: `trademalikk-svg.github.io`
- Allowed origin: `https://trademalikk-svg.github.io`

RP ID बदलने से पहले सावधानी रखें: पहले से registered passkeys पुराने RP ID पर निर्भर होंगी। Supabase passkey support experimental है और client library v2.105.0+ मांगता है। Production enablement से पहले configuration review और test जरूरी है।

## सीमाएँ
- Website fingerprint sensor को सीधे control नहीं कर सकती।
- OS fingerprint, face, PIN या security key में से उपलब्ध verification चुन सकता है।
- सामान्य camera से retina/iris scan का दावा नहीं किया जाता।
- Recovery codes, Owner ID/password recovery और optional supplementary recovery phrase अगले implementation चरण हैं।
- इस code change से live project में passkeys enable नहीं होतीं।


## Owner ID और Password Recovery

1. इस project में Owner ID अलग username नहीं है; यह वही verified email है जो Supabase account में इस्तेमाल होता है।
2. Owner Security page पर **Owner ID / Password Recovery** section खोलें।
3. अपना verified email लिखकर **Password Reset Link भेजें** दबाएँ।
4. अगर उस email से account मौजूद है, तो Supabase की ओर से reset instructions आएँगी। Inbox और Spam folder देखें।
5. Email में मिले link को उसी browser में खोलें। Owner Security page पर नया password और confirmation भरें।
6. Password update होने के बाद नए password से sign in करें। Password reset अपने-आप किसी account को Owner role नहीं देता।

सुरक्षा के लिए पेज यह नहीं बताता कि email से account मौजूद है या नहीं। Owner ID भूल गए हों तो अपने account का verified email पहचानना जरूरी है; email-only प्रक्रिया किसी दूसरे account की ID उजागर नहीं करती।

## अभी बाकी

- Recovery codes का secure one-time issue/consume और lost-device recovery flow अभी implement नहीं हुआ है।
- Optional Lover Name अभी enable नहीं है। इसे कभी भी अकेले login या MFA bypass के रूप में इस्तेमाल नहीं किया जाएगा।
- सभी devices से session revocation और passkey revocation का पूरा recovery flow अगला चरण है।
