def generate_prompt(title):
    prompt = f"""
    Napisz recenzję filmu pod tytułem "{title}" w maksymalnie 200 słowach. Uwzględnij krótki opis 
fabuły, ocenę filmu (np. 8/10), analizę gry aktorskiej i reżyserii. Styl recenzji powinien być 
profesjonalny, ale przystępny, z lekkim humorem. Recenzja nie powinna zdradzać kluczowych 
zwrotów akcji. Jeśli film nie istnieje napisz, że taki nie istnieje.
"""
    return prompt