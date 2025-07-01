'use client';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div>
      <h1>Error occurred</h1>
      <button onClick={reset}>Try again</button>
    </div>
  );
} 