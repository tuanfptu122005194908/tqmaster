from google import genai
import os

try:
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY_1", "placeholder1"))
    print("Available models:")
    for m in client.models.list():
        print(m.name)
except Exception as e:
    print(f"Error checking key 1: {e}")

print("\n----------------\n")
try:
    client2 = genai.Client(api_key=os.environ.get("GEMINI_API_KEY_2", "placeholder2"))
    print("Available models for key 2:")
    for m in client2.models.list():
        print(m.name)
except Exception as e:
    print(f"Error checking key 2: {e}")
