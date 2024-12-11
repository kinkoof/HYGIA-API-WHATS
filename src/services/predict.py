from flask import Flask, request, jsonify
import joblib
import re
from nltk.corpus import stopwords
from nltk.stem import RSLPStemmer

app = Flask(__name__)

modelo_salvo = 'ia/modelo_random_forest.pkl'
vectorizer_salvo = 'ia/vectorizer.pkl'

model = joblib.load(modelo_salvo)
vectorizer = joblib.load(vectorizer_salvo)

def preprocessar_texto(texto):
    texto = re.sub(r'[^\w\s]', '', texto)
    texto = re.sub(r'\d+', '', texto)
    texto = texto.lower()
    stemmer = RSLPStemmer()
    stop_words = set(stopwords.words('portuguese'))
    palavras = texto.split()
    palavras = [stemmer.stem(p) for p in palavras if p not in stop_words]
    return ' '.join(palavras)

@app.route('/processa_sintomas', methods=['POST'])
def processa_sintomas():
    data = request.get_json()
    sintomas = data['sintomas']

    sintomas_preproc = preprocessar_texto(sintomas)
    sintomas_transf = vectorizer.transform([sintomas_preproc])

    remedio = model.predict(sintomas_transf)[0]

    return jsonify({'remedio': remedio})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000, ssl_context='adhoc')

