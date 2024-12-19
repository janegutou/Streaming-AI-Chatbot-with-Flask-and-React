from flask import Flask, request, jsonify, Response
from flask_cors import CORS 
import time
import uuid
from operator import itemgetter

from dotenv import load_dotenv
load_dotenv()

from langchain_core.messages import trim_messages
from langchain_core.output_parsers import StrOutputParser
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI


llm = ChatOpenAI(model="gpt-3.5-turbo-0125", temperature=0) 

store = {} # temp store to dict to keep chat history, can change to database or redis in production

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return 'Welcome to the Flask API!'

@app.route('/test')
def test():
    return jsonify({'message': 'API is working', 'status': 'success'})

@app.route('/api/refresh_session', methods=['POST'])
def set_session(): 
    session_id = str(uuid.uuid4())
    print("session refreshed:", session_id)
    return jsonify({"session_id": session_id}), 200

@app.route('/api/stream')
def stream():
    
    session_id = request.args.get('session_id')
    if not session_id:
        print("No active session")
        return jsonify({"error": "No active session"}), 401
    
    question = request.args.get('question')
    if not question:
        print("No question provided")
        return jsonify({"error": "No question provided"}), 402
    
    print("Session ID:", session_id)
    print("Question:", question)

    return Response(generate_response(question, session_id), content_type='text/event-stream')


def generate_response(question, session_id): 
    
    chat_chain = get_chat_chain()
    stream = chat_chain.stream({"question": question}, config={"configurable": {"session_id": session_id}}) # generate a stream of responses using langchain (simply replace the invoke with stream)

    # reformat stream to event-stream format
    for chunk in stream:
        chunk = chunk.replace("\n", "<br>")
        if chunk.strip():
            #print(chunk)
            time.sleep(.02)
            yield f"data: {chunk}\n\n"
    yield "data: [DONE]\n\n" 

def get_session_history(session_id):
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()
    return store[session_id]

def get_chat_chain():
    
    trimmer = trim_messages(
        max_tokens=1000,
        strategy="last",
        token_counter=llm, 
        start_on="human",
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a helpful assistant. Answer all questions to the best of your ability."
            ),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{question}"),
        ]
    )
    
    chain = RunnablePassthrough.assign(history=itemgetter("history") | trimmer) | prompt | llm | StrOutputParser() 
    chain_with_history = RunnableWithMessageHistory(chain, get_session_history, input_messages_key="question", history_messages_key="history")

    return chain_with_history


if __name__ == '__main__':
    app.run(debug=True)
