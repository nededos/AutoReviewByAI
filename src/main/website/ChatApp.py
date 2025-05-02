import os
import openai
from openai import OpenAI
from dotenv import load_dotenv, find_dotenv
import prompts

# load the .env file
_ = load_dotenv(find_dotenv())
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)
model = "gpt-4o-mini"
temperature = 0.3
max_tokens = 500
topic = ""

# function
def getReview(movieTitle):
    prompts = prompts.generate_prompt(movieTitle)
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": prompts},
    ]
    completion = openai.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return completion.choices[0].message.content
print(getReview())