import numpy as np

def test_logic():
    query_embedding = [0.1, 0.2, 0.3]
    norm = np.linalg.norm(query_embedding)
    print(f"Norm type: {type(norm)}")
    try:
        res = query_embedding / norm
        print(f"Result type: {type(res)}")
        print(f"Result: {res}")
    except TypeError as e:
        print(f"Failed with TypeError: {e}")

if __name__ == "__main__":
    test_logic()
