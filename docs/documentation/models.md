# @axflow/models

Zero-dependency, modular SDK for building robust natural language applications.

```
npm i @axflow/models
```

## Features

* First-class streaming support for both low-level byte streams and higher-level JavaScript object streams
* First-class support for streaming arbitrary data in addition to the LLM response
* Comes with a set of utilities and React hooks for easily creating robust client applications
* Built exclusively on modern web standards such as `fetch` and the stream APIs
* Supports Node 18+, Next.js serverless or edge runtime, browsers, ESM, CJS, and more
* Supports a custom `fetch` implementation for request middleware (e.g., custom headers, logging)

## Supported models

- ✅ OpenAI and OpenAI-compatible Chat, Completion, and Embedding models
- ✅ Cohere and Cohere-compatible Generation and Embedding models
- ✅ Anthropic and Anthropic-compatible Completion models
- Google PaLM models (coming soon)
- Azure OpenAI (coming soon)
- Replicate (coming soon)
- HuggingFace (coming soon)

## Documentation

View the [Guides](/guides) or the reference:

* [@axflow/models/openai/chat](/documentation/models/openai-chat)
* [@axflow/models/openai/completion](/documentation/models/openai-completion)
* [@axflow/models/openai/embedding](/documentation/models/openai-embedding)
* [@axflow/models/anthropic/completion](/documentation/models/anthropic-completion)
* [@axflow/models/cohere/generation](/documentation/models/cohere-generation)
* [@axflow/models/cohere/embedding](/documentation/models/cohere-embedding)
* [@axflow/models/react](/documentation/models/react)
* [@axflow/models/shared](/documentation/models/shared)

## Example Usage

```ts
import {OpenAIChat} from '@axflow/models/openai/chat';
import {CohereGenerate} from '@axflow/models/cohere/generate';
import {StreamToIterable} from '@axflow/models/shared';

const gpt4Stream = OpenAIChat.stream(
  {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'What is the Eiffel tower?' }],
  },
  {
    apiKey: '<openai api key>',
  },
);

const cohereStream = CohereGenerate.stream(
  {
    model: 'command-nightly',
    prompt: 'What is the Eiffel tower?',
  },
  {
    apiKey: '<cohere api key>',
  },
);

// StreamToIterable is optional in recent node versions as
// ReadableStreams already implement the async iterator protocol
for await (const chunk of StreamToIterable(gpt4Stream)) {
  console.log(chunk.choices[0].delta.content);
}

for await (const chunk of StreamToIterable(cohereStream)) {
  console.log(chunk.text);
}
```

For models that support streaming, there is a convenience method for streaming only the string tokens.

```ts
import {OpenAIChat} from '@axflow/models/openai/chat';

const tokenStream = OpenAIChat.streamTokens(
  {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'What is the Eiffel tower?' }],
  },
  {
    apiKey: '<openai api key>',
  },
);

// Example stdout output:
//
// The Eiffel Tower is a renowned wrought-iron landmark located in Paris, France, known globally as a symbol of romance and elegance.
//
for await (const token of tokenStream) {
  process.stdout.write(token);
}

process.stdout.write("\n");
```

## `useChat` hook for dead simple UI integration

We've made building chat and completion UIs trivial. It doesn't get any easier than this 🚀

```ts
///////////////////
// On the server //
///////////////////
import { OpenAIChat } from '@axflow/models/openai/chat';
import { StreamingJsonResponse, type MessageType } from '@axflow/models/shared';

export const runtime = 'edge';

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = await OpenAIChat.streamTokens(
    {
      model: 'gpt-4',
      messages: messages.map((msg: MessageType) => ({ role: msg.role, content: msg.content })),
    },
    {
      apiKey: process.env.OPENAI_API_KEY!,
    },
  );

  return new StreamingJsonResponse(stream);
}

///////////////////
// On the client //
///////////////////
import { useChat } from '@axflow/models/react';

function ChatComponent() {
  const {input, messages, onChange, onSubmit} = useChat();

  return (
    <>
      <Messages messages={messages} />
      <Form input={input} onChange={onChange} onSubmit={onSubmit} />
    </>
  );
}
```

## Next.js edge proxy example

Sometimes you just want to create a proxy to the underlying LLM API. In this example, the server intercepts the request on the edge, adds the proper API key, and forwards the byte stream back to the client.

*Note this pattern works exactly the same with our other models that support streaming, like Cohere and Anthropic.*

```ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenAIChat } from '@axflow/models/openai/chat';

export const runtime = 'edge'

// POST /api/openai/chat
export async function POST(request: NextRequest) {
  const chatRequest = await request.json();

  // We'll stream the bytes from OpenAI directly to the client
  const stream = await OpenAIChat.streamBytes(chatRequest, {
    apiKey: process.env.OPENAI_API_KEY!,
  });

  return new NextResponse(stream);
}
```

On the client, we can use `OpenAIChat.stream` with a custom `apiUrl` in place of the `apiKey` that points to our Next.js edge route.

*DO NOT expose api keys to your frontend.*

```ts
import { OpenAIChat } from '@axflow/models/openai/chat';
import { StreamToIterable } from '@axflow/models/shared';

const stream = await OpenAIChat.stream(
  {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'What is the Eiffel tower?' }],
  },
  {
    apiUrl: "/api/openai/chat",
  }
);

for await (const chunk of StreamToIterable(stream)) {
  console.log(chunk.choices[0].delta.content);
}
```
