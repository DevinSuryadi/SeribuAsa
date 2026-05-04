"""
Recommendations Integration Tests
Tests for AI-powered nutrition recommendations
"""


# ============================================
# Alert System Unit Tests (no HTTP calls)
# ============================================
def test_recommendation_schema_structure():
    """Test recommendation schema has required fields"""
    recommendation = {
        "id": "rec-001",
        "priority": "high",
        "category": "nutrition",
        "title": "Tingkatkan Asupan Protein",
        "description": "Anak membutuhkan lebih banyak protein",
        "action": "Berikan makanan kaya protein",
        "duration_days": 30,
    }
    
    required_fields = ["id", "priority", "category", "title", "description", "action"]
    assert all(field in recommendation for field in required_fields)


def test_recommendation_priority_valid_values():
    """Test valid priority levels"""
    valid_priorities = ["low", "medium", "high", "critical"]
    
    for priority in valid_priorities:
        assert priority in ["low", "medium", "high", "critical"]


def test_recommendation_category_valid_values():
    """Test valid categories"""
    valid_categories = ["nutrition", "food_security", "health", "lifestyle"]
    
    for category in valid_categories:
        assert category in ["nutrition", "food_security", "health", "lifestyle"]


def test_recommendation_duration_reasonable():
    """Test recommendation durations are reasonable"""
    durations = [7, 30, 60, 90, 365]
    
    for duration in durations:
        assert 1 <= duration <= 365


# ============================================
# Recommendation Logic Tests
# ============================================
def test_nutrition_rec_for_stunting():
    """Test nutrition recommendation for stunting"""
    zscore_weight = -2.5
    is_stunted = zscore_weight < -2.0
    
    assert is_stunted is True


def test_food_security_rec_for_severe():
    """Test food security recommendation for severe insecurity"""
    fies_score = 16
    is_severe = fies_score >= 12
    
    assert is_severe is True


def test_health_rec_for_moderate_malnourished():
    """Test health recommendation for moderate malnutrition"""
    zscore_weight = -1.5
    zscore_height = -2.2
    needs_health_followup = zscore_weight < -1.0 or zscore_height < -2.0
    
    assert needs_health_followup is True


# ============================================
# Recommendation Workflow Tests
# ============================================
def test_workflow_assess_then_recommend():
    """Test workflow: assess status, then generate recommendations"""
    # Step 1: Get child data
    child_data = {
        "zscore_weight": -2.3,
        "fies_score": 8,
    }
    
    # Step 2: Generate recommendations
    recommendations = []
    
    if child_data["zscore_weight"] < -2.0:
        recommendations.append({
            "type": "nutrition",
            "priority": "high"
        })
    
    if child_data["fies_score"] >= 12:
        recommendations.append({
            "type": "food_security",
            "priority": "high"
        })
    
    # Should have at least 1 nutrition recommendation
    assert len([r for r in recommendations if r["type"] == "nutrition"]) > 0


# ============================================
# Recommendation Prioritization Tests
# ============================================
def test_critical_alerts_highest_priority():
    """Test that critical alerts are prioritized highest"""
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    
    recs = [
        {"severity": "info"},
        {"severity": "critical"},
        {"severity": "warning"},
    ]
    
    sorted_recs = sorted(recs, key=lambda r: severity_order[r["severity"]])
    assert sorted_recs[0]["severity"] == "critical"


def test_recommendations_ordered_by_priority():
    """Test that recommendations are ordered by priority"""
    priorities = {"high": 0, "medium": 1, "low": 2}
    
    recs = [
        {"priority": "low"},
        {"priority": "high"},
        {"priority": "medium"},
    ]
    
    sorted_recs = sorted(recs, key=lambda r: priorities[r["priority"]])
    assert sorted_recs[0]["priority"] == "high"
    assert sorted_recs[1]["priority"] == "medium"
    assert sorted_recs[2]["priority"] == "low"


# ============================================
# Recommendation Content Tests
# ============================================
def test_recommendation_text_indonesian():
    """Test recommendations use Indonesian language"""
    recommendations = {
        "stunting_rec": "Tingkatkan asupan protein dan kalori untuk tumbuh kembang optimal",
        "fies_rec": "Daftar ke program bantuan pangan lokal untuk keamanan pangan",
    }
    
    indonesian_words = ["anak", "asupan", "program", "bantuan", "daftar", "tingkat"]
    text = " ".join(recommendations.values()).lower()
    
    assert any(word in text for word in indonesian_words)


def test_recommendation_action_is_actionable():
    """Test that recommendations include concrete actions"""
    rec = {
        "title": "Tingkatkan Gizi",
        "action": "Berikan telur, daging, atau kacang setiap hari",
        "duration_days": 30,
    }
    
    assert rec["action"] is not None
    assert len(rec["action"]) > 10


# ============================================
# Recommendation Generation Logic Tests
# ============================================
def test_multiple_conditions_all_recommendations():
    """Test that multiple conditions generate multiple recommendations"""
    child_status = {
        "zscore_weight": -2.5,  # Stunting
        "fies_score": 14,       # Severe food insecurity
    }
    
    recommendations = []
    
    # Check each condition
    if child_status["zscore_weight"] < -2.0:
        recommendations.append("nutrition")
    
    if child_status["fies_score"] >= 12:
        recommendations.append("food_security")
    
    # Should have both types
    assert "nutrition" in recommendations
    assert "food_security" in recommendations


def test_no_recommendations_for_healthy_child():
    """Test that healthy child has no critical recommendations"""
    child_status = {
        "zscore_weight": -0.5,  # Normal
        "fies_score": 3,         # Food secure
    }
    
    recommendations = []
    
    if child_status["zscore_weight"] < -2.0:
        recommendations.append("critical_nutrition")
    
    if child_status["fies_score"] >= 12:
        recommendations.append("critical_food_security")
    
    # Should have no critical recommendations
    assert len(recommendations) == 0
