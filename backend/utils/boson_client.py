from openai import OpenAI
from dotenv import load_dotenv
import os
import requests
import sys

# Load .env from the project root, even if script runs from a subfolder
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../.env"))
print("Loading .env from:", os.path.join(os.path.dirname(__file__), "../../.env"), file=sys.stderr)

client = OpenAI(
    api_key="bai-983X8jWnN1Acm57MI3t-d4BqmxkDX_DxMyNAJQBJyB9WEyZ8",
    base_url="https://hackathon.boson.ai/v1"
)
