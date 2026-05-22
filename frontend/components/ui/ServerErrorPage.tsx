// components/ui/ServerErrorPage.jsx

export default function ServerErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Server Unavailable
        </h1>

        <p className="text-gray-400 mb-6">
          We're having trouble connecting to the server.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="bg-white text-black px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    </div>
  );
}