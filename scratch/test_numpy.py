import numpy as np

def test_logic():
    query_embedding = [0.1, 0.2, 0.3]
    try:
        q_norm = query_embedding / np.linalg.norm(query_embedding)
        print("Success")
    except TypeError as e:
        print(f"Failed with TypeError: {e}")

if __name__ == "__main__":
    test_logic()
