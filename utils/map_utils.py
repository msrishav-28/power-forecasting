"""
Map Utilities for Satellite Corridor Intelligence Module
"""
import folium
from folium.plugins import HeatMap
import numpy as np

def create_base_map(location=[24.0, 86.5], zoom_start=7):
    """Create a base Folium map for ER-I region."""
    m = folium.Map(
        location=location,
        zoom_start=zoom_start,
        tiles="CartoDB dark_matter"
    )
    return m

def add_corridor_to_map(m, corridor_row, risk_color, tooltip=None):
    """Add a corridor segment to the map."""
    coords = corridor_row["geometry_coords"]
    
    # Create popup content
    popup_html = f"""
    <div style="font-family: Arial; min-width: 200px;">
        <h4 style="margin: 0; color: #01696f;">{corridor_row['segment_id']}</h4>
        <p style="margin: 5px 0;">
            <b>States:</b> {corridor_row['states']}<br>
            <b>Voltage:</b> {corridor_row['voltage_kv']} kV<br>
            <b>Length:</b> {corridor_row['length_km']} km<br>
            <b>Base NDVI:</b> {corridor_row['base_ndvi']:.3f}<br>
            <b>Last Inspection:</b> {corridor_row['last_inspection'][:10] if isinstance(corridor_row['last_inspection'], str) else str(corridor_row['last_inspection'])[:10]}<br>
            <b>Risk Level:</b> <span style="color: {risk_color}; font-weight: bold;">{risk_color.upper()}</span>
        </p>
    </div>
    """
    
    folium.PolyLine(
        locations=coords,
        color=risk_color,
        weight=4,
        opacity=0.8,
        tooltip=tooltip or f"{corridor_row['segment_id']} | {corridor_row['states']}",
        popup=folium.Popup(popup_html, max_width=300)
    ).add_to(m)
    
    # Add markers at endpoints
    folium.CircleMarker(
        location=coords[0],
        radius=4,
        color=risk_color,
        fill=True,
        fill_color=risk_color,
        popup=f"Start: {corridor_row['segment_id']}"
    ).add_to(m)
    
    folium.CircleMarker(
        location=coords[-1],
        radius=4,
        color=risk_color,
        fill=True,
        fill_color=risk_color,
        popup=f"End: {corridor_row['segment_id']}"
    ).add_to(m)
    
    return m

def get_risk_color(risk_label):
    """Get color for risk label."""
    colors = {
        "Low": "#22c55e",      # green
        "Medium": "#f59e0b",   # amber
        "High": "#ef4444",     # red
        "Critical": "#7f1d1d"  # dark red
    }
    return colors.get(risk_label, "#6b7280")  # gray default

def add_risk_legend(m):
    """Add a risk level legend to the map."""
    legend_html = """
    <div style="position: fixed; bottom: 50px; right: 50px; 
                background-color: rgba(14, 17, 23, 0.9); 
                padding: 10px; border-radius: 5px;
                border: 1px solid #01696f;
                z-index: 9999;
                color: #cdccca;
                font-family: Arial;">
        <h4 style="margin: 0 0 10px 0; color: #01696f;">Risk Level</h4>
        <div><span style="color: #22c55e;">●</span> Low</div>
        <div><span style="color: #f59e0b;">●</span> Medium</div>
        <div><span style="color: #ef4444;">●</span> High</div>
        <div><span style="color: #7f1d1d;">●</span> Critical</div>
    </div>
    """
    m.get_root().html.add_child(folium.Element(legend_html))
    return m

def add_state_labels(m):
    """Add state labels to the map."""
    state_centers = {
        "Bihar": [25.6, 85.5],
        "Jharkhand": [23.6, 85.3],
        "West Bengal": [22.9, 87.8],
        "Odisha": [20.5, 84.5],
        "Sikkim": [27.5, 88.4]
    }
    
    for state, center in state_centers.items():
        folium.Marker(
            location=center,
            icon=folium.DivIcon(
                icon_size=(100, 20),
                icon_anchor=(50, 10),
                html=f'<div style="font-family: Arial; font-weight: bold; color: #cdccca; font-size: 12px; text-align: center;">{state}</div>'
            )
        ).add_to(m)
    
    return m
