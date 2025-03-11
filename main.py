from models import Csv

if __name__ == "__main__":
    csv_handler = Csv("inventaire.csv")

    print(csv_handler.read())