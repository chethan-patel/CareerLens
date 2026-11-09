import mysql.connector
from getpass import getpass

password = getpass("Enter your MySQL root password: ")

try:
    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password=password,
        database="careerlens",
        port=3306
    )

    if connection.is_connected():
        print("SUCCESS! Python connected to MySQL!")
        print("Database: careerlens")

    connection.close()

except mysql.connector.Error as error:
    print("Database connection failed:", error)