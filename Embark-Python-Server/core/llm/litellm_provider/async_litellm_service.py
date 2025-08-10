from typing import Any

from litellm import acompletion
from base_llm_provider import BaseLLMProvider

class AsyncLiteLLMService(BaseLLMProvider):

    def get_image_processing_message(self, base64_encoded_image: list, prompt: str, system_message: str):

        content= [{"type": "text", "text": prompt}]

        for image in base64_encoded_image:
            content.append(
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image}"
                    }
                }
            )
            
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": content}
        ]

        return messages
    
    def get_messages(self, prompt: str, system_message: str):
        return [
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ]

    async def execute(
        self,
        model: str,
        prompt: str,
        system_message: str,
        top_probability: float = 1.0,
        temperature: float = 0,
        max_tokens: int = None,
        base64_encoded_image: list = None,
        response_format: Any = None,
    ):
        response = await acompletion(
            model=model,
            response_format=response_format if response_format is not None else None,
            messages=self.get_messages(prompt, system_message) if not base64_encoded_image else self.get_image_processing_message(base64_encoded_image, prompt, system_message),
            temperature=temperature if temperature is not None else None,
            top_p=top_probability if top_probability is not None else None,
            max_tokens=max_tokens if max_tokens is not None else None,
        )
        return response.choices[0].message.content