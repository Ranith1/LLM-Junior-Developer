from openai import OpenAI
from dotenv import load_dotenv
import os

# just testing ignore 
load_dotenv()

client = OpenAI(api_key=os.getenv("OPEN_API_KEY"))

response = client.responses.create(
    model="gpt-5",
    input="Write a one-sentence bedtime story about a unicorn."
)

print(response.output_text)

