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
