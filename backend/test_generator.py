#!/usr/bin/env python3
"""
Simple test script for the timetable generator
"""

import requests
import json

# Test configuration
BASE_URL = "http://localhost:8000"
USER_ID = "088f7a98-e77c-45e0-9a65-859959a2434d"

def test_generator_config():
    """Test the generator configuration endpoint"""
    print("🧪 Testing generator configuration...")
    
    response = requests.post(
        f"{BASE_URL}/generator/config",
        headers={"Content-Type": "application/json"},
        json={"user_id": USER_ID}
    )
    
    if response.status_code == 200:
        data = response.json()
        if data["status"] == "success":
            config = data["config"]
            print(f"✅ Config loaded successfully!")
            print(f"   📚 Subjects: {len(config['available_subjects'])}")
            print(f"   👨‍🏫 Teachers: {len(config['available_teachers'])}")
            print(f"   🎓 Classes: {len(config['available_classes'])}")
            return config
        else:
            print(f"❌ Config error: {data.get('message', 'Unknown error')}")
            return None
    else:
        print(f"❌ HTTP Error: {response.status_code}")
        return None

def test_smart_generation():
    """Test smart timetable generation"""
    print("\n🧪 Testing smart timetable generation...")
    
    response = requests.post(
        f"{BASE_URL}/generate_timetable",
        headers={"Content-Type": "application/json"},
        json={"user_id": USER_ID}
    )
    
    if response.status_code == 200:
        data = response.json()
        if data["status"] == "success":
            print("✅ Smart generation successful!")
            if data["data"]:
                timetable = data["data"][0] if isinstance(data["data"], list) else data["data"]
                if "details" in timetable and "classes" in timetable["details"]:
                    classes = timetable["details"]["classes"]
                    print(f"   📋 Generated {len(classes)} class schedules")
                    total_entries = sum(len(cls.get("schedule", [])) for cls in classes)
                    print(f"   ⏰ Total schedule entries: {total_entries}")
                else:
                    print("   ⚠️  Unexpected timetable structure")
            return True
        else:
            print(f"❌ Generation error: {data.get('message', 'Unknown error')}")
            return False
    else:
        print(f"❌ HTTP Error: {response.status_code}")
        try:
            error_data = response.json()
            print(f"   Error details: {error_data}")
        except:
            print(f"   Response: {response.text}")
        return False

def test_get_timetable():
    """Test getting existing timetable"""
    print("\n🧪 Testing get timetable...")
    
    response = requests.get(f"{BASE_URL}/get_timetable/{USER_ID}")
    
    if response.status_code == 200:
        data = response.json()
        if data["status"] == "success":
            print("✅ Timetable retrieved successfully!")
            return True
        elif data["status"] == "no_data":
            print("ℹ️  No timetable found (this is okay)")
            return True
        else:
            print(f"❌ Get timetable error: {data.get('message', 'Unknown error')}")
            return False
    else:
        print(f"❌ HTTP Error: {response.status_code}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Timetable Generator Tests\n")
    
    # Test 1: Configuration
    config = test_generator_config()
    if not config:
        print("\n❌ Configuration test failed. Cannot proceed with other tests.")
        return
    
    # Test 2: Get existing timetable
    test_get_timetable()
    
    # Test 3: Smart generation
    if config["available_subjects"] and config["available_teachers"] and config["available_classes"]:
        success = test_smart_generation()
        if success:
            print("\n✅ All tests passed! The timetable generator is working correctly.")
        else:
            print("\n❌ Smart generation test failed.")
    else:
        print("\n⚠️  Skipping smart generation test - no data available")
        print("   Please upload subjects, teachers, and classes first.")
    
    print("\n🎉 Test run completed!")

if __name__ == "__main__":
    main()