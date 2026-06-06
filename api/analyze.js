export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 required' });
  }

  const prompt = `Sen bir veteriner oftalmoloji asistanısın. Bu köpek gözü fotoğrafını dikkatle incele ve JSON formatında analiz et.

Fotoğrafa bakarak şunları değerlendir:
- Göz kızarıklığı, akıntı, şişlik, bulanıklık, renk değişimi
- Kornea durumu (saydam mı, bulanık mı, leke var mı)
- Konjonktiva rengi (pembe/kırmızı/soluk)
- Göz kapağı pozisyonu
- Genel göz sağlığı

SADECE şu JSON formatını döndür, başka hiçbir şey yazma:
{
  "healthScore": <0-100 arası sayı>,
  "status": <"healthy" veya "mild" veya "moderate" veya "severe">,
  "conditions": [
    {
      "name": "<hastalık/durum adı Türkçe>",
      "description": "<kısa açıklama Türkçe>",
      "severity": "<Hafif veya Orta veya Ciddi>"
    }
  ],
  "recommendations": ["<öneri 1 Türkçe>", "<öneri 2>"],
  "summary": "<2-3 cümle genel değerlendirme Türkçe>"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high'
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonString = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return res.status(200).json(JSON.parse(jsonString));
  } catch (error) {
    return res.status(500).json({ error: 'Analysis failed' });
  }
}
