import time

from pymongo import MongoClient
from pymongo.errors import PyMongoError

from config import Config

_client = None


def get_db(retries=10, delay=2):
    """Return the MongoDB database handle.

    Retries on startup so the API can wait for the db container to be ready.
    """
    global _client
    if _client is not None:
        return _client[Config.MONGO_DB]

    last_err = None
    for _ in range(retries):
        try:
            client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=2000)
            client.admin.command("ping")
            _client = client
            return client[Config.MONGO_DB]
        except PyMongoError as err:  # pragma: no cover
            last_err = err
            time.sleep(delay)
    raise last_err


def next_id(collection):
    """Return the next sequential integer id for a collection.

    Kept deliberately simple (and sequential) for the trial.
    """
    last = collection.find_one(sort=[("id", -1)])
    return (last["id"] + 1) if last else 1
