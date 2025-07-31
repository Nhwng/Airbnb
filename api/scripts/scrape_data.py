import pyairbnb
import pymongo
import logging
import re
from datetime import datetime
import time

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# Cấu hình MongoDB
mongo_uri = "mongodb+srv://pvaquang:8UdrhgbNR56tceR1@cluster0.ed21p2l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
try:
    client = pymongo.MongoClient(mongo_uri)
    db = client['airbnb_db']
    logging.info("Connected to MongoDB Atlas")
except Exception as e:
    logging.error(f"Failed to connect to MongoDB: {e}")
    exit(1)

def parse_price(price_obj):
    try:
        item = price_obj.get("raw", [])[0]["items"][0]
        price_str = item.get("priceString", "")
        num = int(re.sub(r"[^\d]", "", price_str))
        currency = "VND" if "₫" in price_str else "USD"
        return num, currency
    except Exception:
        return None, None

def process_airbnb_data():
    # Danh sách các thành phố với tọa độ
    cities = [
        {"name": "Ho Chi Minh City", "ne_lat": 10.8231, "ne_long": 106.7297, "sw_lat": 10.7075, "sw_long": 106.6072},
        {"name": "Ha Noi", "ne_lat": 21.0542, "ne_long": 105.8519, "sw_lat": 20.9387, "sw_long": 105.7334},
        {"name": "Da Nang", "ne_lat": 16.0787, "ne_long": 108.2500, "sw_lat": 15.9650, "sw_long": 108.1333},
    ]
    check_in = "2025-06-15"
    check_out = "2025-06-16"
    zoom_value = 10
    price_min = 0
    price_max = 0
    place_type = ""
    amenities = []
    currency = "VND"
    language = "en"
    proxy_url = ""

    try:
        for city in cities:
            search_results = pyairbnb.search_all(
                check_in=check_in,
                check_out=check_out,
                ne_lat=city["ne_lat"],
                ne_long=city["ne_long"],
                sw_lat=city["sw_lat"],
                sw_long=city["sw_long"],
                zoom_value=zoom_value,
                price_min=price_min,
                price_max=price_max,
                place_type=place_type,
                amenities=amenities,
                currency=currency,
                language=language,
                proxy_url=proxy_url
            )
            search_results = search_results[:20]
            for i, listing in enumerate(search_results, 1):
                room_id = listing.get("room_id")
                if not room_id:
                    logging.warning(f"Bỏ qua listing {i}: Không tìm thấy room_id.")
                    continue

                try:
                    details_data = pyairbnb.get_details(
                        room_id=room_id,
                        check_in=check_in,
                        check_out=check_out,
                        currency=currency,
                        language=language,
                        proxy_url=proxy_url
                    )

                    # Xử lý listing với cột city
                    title = details_data.get("title")
                    description = details_data.get("description")
                    room_type = details_data.get("room_type")
                    person_capacity = details_data.get("person_capacity")
                    lat = details_data.get("coordinates", {}).get("latitude")
                    lng = details_data.get("coordinates", {}).get("longitude")
                    nightly_price, currency = parse_price(details_data.get("price", {}))

                    new_data = {
                        "city": city["name"],  # Thêm cột city
                        "title": title,
                        "description": description,
                        "room_type": room_type,
                        "person_capacity": person_capacity,
                        "latitude": lat,
                        "longitude": lng,
                        "nightly_price": nightly_price,
                        "currency": currency,
                        "updated_at": datetime.now(),
                    }

                    existing_listing = db.listings.find_one({"listing_id": room_id})
                    if existing_listing:
                        update_needed = False
                        for key, value in new_data.items():
                            if key not in existing_listing or existing_listing[key] != value:
                                update_needed = True
                                break
                        if update_needed:
                            db.listings.update_one(
                                {"listing_id": room_id},
                                {"$set": new_data}
                            )
                    else:
                        db.listings.insert_one({
                            "listing_id": room_id,
                            **new_data,
                            "created_at": datetime.now(),
                        })

                    # Xử lý amenities
                    for amen in details_data.get("amenities", []):
                        name = amen.get("title")
                        if not name:
                            continue
                        existing_amenity = db.amenities.find_one({"listing_id": room_id, "title": name})
                        if existing_amenity:
                            if not existing_amenity.get("is_available", True):
                                db.amenities.update_one(
                                    {"listing_id": room_id, "title": name},
                                    {"$set": {"is_available": True}}
                                )
                        else:
                            db.amenities.insert_one({
                                "listing_id": room_id,
                                "title": name,
                                "is_available": True,
                            })

                    # Xử lý images
                    for img in details_data.get("images", []):
                        url = img.get("url")
                        caption = img.get("title")
                        if not url:
                            continue
                        existing_image = db.images.find_one({"listing_id": room_id, "url": url})
                        if existing_image:
                            if existing_image.get("caption") != caption:
                                db.images.update_one(
                                    {"listing_id": room_id, "url": url},
                                    {"$set": {"caption": caption}}
                                )
                        else:
                            db.images.insert_one({
                                "listing_id": room_id,
                                "url": url,
                                "caption": caption,
                            })

                    # Xử lý availability
                    for month in details_data.get("calendar", []):
                        for day in month.get("days", []):
                            d = day.get("calendarDate")
                            avail = day.get("available", False)
                            min_n = day.get("minNights")
                            p_str = day.get("price", {}).get("localPriceFormatted")
                            p_val = int(re.sub(r"[^\d]", "", p_str)) if p_str else None

                            existing_availability = db.availability.find_one({"listing_id": room_id, "date": datetime.strptime(d, "%Y-%m-%d")})
                            if existing_availability:
                                if (existing_availability.get("is_available") != avail or
                                    existing_availability.get("price") != p_val or
                                    existing_availability.get("min_nights") != min_n):
                                    db.availability.update_one(
                                        {"listing_id": room_id, "date": datetime.strptime(d, "%Y-%m-%d")},
                                        {"$set": {
                                            "is_available": avail,
                                            "price": p_val,
                                            "min_nights": min_n,
                                        }}
                                    )
                            else:
                                db.availability.insert_one({
                                    "listing_id": room_id,
                                    "date": datetime.strptime(d, "%Y-%m-%d"),
                                    "is_available": avail,
                                    "price": p_val,
                                    "min_nights": min_n,
                                })

                except Exception as e:
                    continue

                time.sleep(1)  # Giữ độ trễ để tránh giới hạn tốc độ

        logging.info("All data processed and loaded into MongoDB.")

    except Exception as e:
        logging.error(f"Lỗi trong quá trình lấy dữ liệu: {str(e)}")
        raise

    finally:
        client.close()
        logging.info("MongoDB connection closed.")

if __name__ == "__main__":
    process_airbnb_data()