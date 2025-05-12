import React, { useState, useEffect, useRef } from "react";
import { vapi } from "../vapi.sdk";

type Message = {
  role: string;
  content: string;
};

type TranscriptMessage = {
  type: string;
  role: string;
  transcript: string;
  transcriptType: "interim" | "final";
};

const Agent: React.FC = () => {
  const [callStatus, setCallStatus] = useState<"INACTIVE" | "CONNECTING" | "ACTIVE" | "FINISHED">("INACTIVE");
  const [messages, setMessages] = useState<Message[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onCallStart = () => setCallStatus("ACTIVE");
    const onCallEnd = () => setCallStatus("FINISHED");
    const onMessage = (message: TranscriptMessage) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        setMessages((prev) => [
          ...prev,
          { role: message.role, content: message.transcript },
        ]);
      }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
    };
  }, []);

  const handleCall = async () => {
    setCallStatus("CONNECTING");
    await vapi.start(import.meta.env.VITE_VAPI_WORKFLOW_ID!, {
      variableValues: { username: "User", userid: "12345" },
      clientMessages: [], // Add appropriate client messages if needed
      serverMessages: [], // Add appropriate server messages if needed
    });
  };

  const handleDisconnect = () => {
    setCallStatus("FINISHED");
    vapi.stop();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">Campaign Assistant</h1>

      <div className="bg-white shadow-soft rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Interact with the Assistant</h2>
        <div className="flex gap-4">
          <button
            onClick={handleCall}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
          >
            Start Call
          </button>
          <button
            onClick={handleDisconnect}
            className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600"
          >
            End Call
          </button>
        </div>
      </div>

      <div className="bg-white shadow-soft rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Call Status</h2>
        <p className="text-gray-600">{callStatus}</p>
      </div>

      <div className="bg-white shadow-soft rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Messages</h2>
        <div ref={chatContainerRef} className="h-64 overflow-y-auto">
          {messages.length > 0 ? (
            <ul className="space-y-2">
              {messages.map((message, index) => (
                <li key={index} className="text-gray-600">
                  <span className="font-medium text-gray-800">{message.role}:</span> {message.content}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No messages yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Agent;