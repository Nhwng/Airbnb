import pymongo
mongo_uri = "mongodb+srv://pvaquang:8UdrhgbNR56tceR1@cluster0.ed21p2l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = pymongo.MongoClient(mongo_uri)
db = client['airbnb_db']
print(db.list_collection_names())  # Should print an empty list if no collections exist yet
client.close()