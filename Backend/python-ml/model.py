from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def suggest_technicians(issue, technicians):
    if not technicians:
        return []

    texts = [issue] + [tech["skills"] + " " + tech["about"] for tech in technicians]
    tfidf = TfidfVectorizer().fit_transform(texts)
    scores = cosine_similarity(tfidf[0:1], tfidf[1:]).flatten()

    sorted_indices = scores.argsort()[::-1]

    sorted_techs = []
    for i in sorted_indices:
        tech = technicians[i]
        tech["match_score"] = round(float(scores[i]), 2)
        sorted_techs.append(tech)

    return sorted_techs
