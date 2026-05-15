"""Sample file for testing ast_from_file.py."""

def greet(name: str) -> str:
    message = f"Hello, {name}!"
    return message


if __name__ == "__main__":
    print(greet("world"))
