
//           import React, {useState} from "react";
//           import {Card, CardContent} from "@/components/ui/card";
//           import {Input} from "@/components/ui/input";
//           import {Button} from "@/components/ui/button";
//           import {motion} from "framer-motion";

// const AICharacter = () => {
//   const [messages, setMessages] = useState([
//           {from: "ia", text: "Bonjour aventurier ! Je suis Elor, le mage du savoir. Pose-moi tes questions." }
//           ]);
//           const [input, setInput] = useState("");

//   const handleSend = async () => {
//     if (!input.trim()) return;
//           const userMessage = {from: "user", text: input };
//     setMessages((prev) => [...prev, userMessage]);
//           setInput("");

//           // Appel à l'API OpenAI ou autre ici
//           const response = await fetch("/api/ask", {
//             method: "POST",
//           headers: {"Content-Type": "application/json" },
//           body: JSON.stringify({message: input })
//     });

//           const data = await response.json();
//           const aiMessage = {from: "ia", text: data.reply };
//     setMessages((prev) => [...prev, aiMessage]);
//   };

//           return (
//           <div className="max-w-xl mx-auto mt-10 p-4">
//             <Card className="bg-gray-900 text-white p-4 rounded-2xl shadow-xl">
//               <CardContent className="space-y-4 h-[500px] overflow-y-auto">
//                 {messages.map((msg, i) => (
//                   <motion.div
//                     key={i}
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ duration: 0.3 }}
//                     className={`p-2 rounded-xl ${msg.from === "ia" ? "bg-purple-800 self-start" : "bg-blue-600 self-end"}`}
//                   >
//                     <p><strong>{msg.from === "ia" ? "Elor" : "Toi"}:</strong> {msg.text}</p>
//                   </motion.div>
//                 ))}
//               </CardContent>
//               <div className="flex gap-2 mt-4">
//                 <Input
//                   className="flex-1"
//                   value={input}
//                   onChange={(e) => setInput(e.target.value)}
//                   placeholder="Pose ta question à Elor..."
//                 />
//                 <Button onClick={handleSend}>Envoyer</Button>
//               </div>
//             </Card>
//           </div>
//           );
// };

//           export default AICharacter;


          const response = await fetch("http://localhost:5000/api/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: input }),
        });
