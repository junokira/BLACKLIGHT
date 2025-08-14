export async function a1111Txt2Img({ endpoint = "http://127.0.0.1:7860", prompt, negative_prompt = "", steps = 25, width = 768, height = 512 }) {
  const res = await fetch(`${endpoint}/sdapi/v1/txt2img`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, negative_prompt, steps, width, height })
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  const [b64] = data.images || [];
  return b64 ? `data:image/png;base64,${b64}` : null;
}


