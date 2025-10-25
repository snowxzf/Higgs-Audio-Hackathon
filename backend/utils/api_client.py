from boson_client import client
resp = client.chat.completions.create(
    model="higgs-audio-understanding-Hackathon",
    messages=[{"role":"user","content":"Say hello from Boson AI!"}]
)
print(resp.choices[0].message.content)

import base64
def encode_audio(file_path):
    with open(file_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

audio_b64 = encode_audio("backend/utils/sample.mp3")
fmt = "mp3"

response = client.chat.completions.create(
    model="higgs-audio-understanding-Hackathon",
    messages=[
        {"role": "system", "content": "Transcribe this audio."},
        {"role": "user", "content":[{"type":"input_audio","input_audio":{"data":audio_b64,"format":fmt}}]}
    ],
    max_completion_tokens=512,
    temperature=0.0
)

print(response.choices[0].message.content)