import sys
import json
import joblib
import re
from nltk.corpus import stopwords
from nltk.stem import RSLPStemmer

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

input_data = sys.argv[1]
sintomas_preproc = preprocessar_texto(input_data)

sintomas_transf = vectorizer.transform([sintomas_preproc])

remedio = model.predict(sintomas_transf)[0]

print(json.dumps({'remedio': remedio}))
