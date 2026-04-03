from pathlib import Path
import pandas as pd 
import folium 

def validate_columns(df: pd.DataFrame) -> None:
    required = {"time_sec", "latitude", "longitude", "altitude"}
    df.columns = df.columns.str.strip()
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"CSV에 필요한 컬럼이 없습니다.: {sorted(missing)}")

def split_by_dateline(points: list[tuple[float, float]]) -> list[list[tuple[float, float]]]:
    """
    경도가 +- 180 경계를 넘으면 포인트 분리
    """

    if not points:
        return []

    segments: list[list[tuple[float, float]]] = []
    current_segment = [points[0]]

    for prev, curr in zip(points, points[1:]):
        prev_lat, prev_lon = prev
        curr_lat, curr_lon = curr

        if abs(curr_lon - prev_lon) > 180:
            segments.append(current_segment)
            current_segment = [curr]
        else:
            current_segment.append(curr)

    if current_segment:
        segments.append(current_segment)
    
    return segments

def build_map(df: pd.DataFrame) -> folium.map:
    points = list(zip(df["latitude"], df["longitude"]))

    if not points:
        raise ValueError("표시할 궤적 데이터가 없습니다.")

    center_lat = df["latitude"].mean()
    center_lon = df["longitude"].mean()

    fmap = folium.Map(
        location=[center_lat, center_lon],
        zoom_start = 3,
        tiles="CartoDB positron"
    )

    segments = split_by_dateline(points)

    for segment in segments:
        folium.PolyLine(
            locations = segment,
            weight=3,
            opacity=0.9,
            tooltip="Ground Track"
        ).add_to(fmap)

    start_row = df.iloc[0]
    end_row = df.iloc[-1]

    folium.Marker(
        location=[start_row["latitude"], start_row["longitude"]],
        tooltip="Start",
        popup=(
            f"Start<br>"
            f"time={start_row['time_sec']}<br>"
            f"lat={start_row['latitude']:.6f}<br>"
            f"lon={start_row['longitude']:.6f}"
        ),
        icon=folium.Icon(icon="play")
    ).add_to(fmap)

    folium.Marker(
        location=[end_row["latitude"], end_row["longitude"]],
        tooltip="End",
        popup=(
            f"End<br>"
            f"time={end_row['time_sec']}<br>"
            f"lat={end_row['latitude']:.6f}<br>"
            f"lon={end_row['longitude']:.6f}"
        ),
        icon=folium.Icon(icon="stop")
    ).add_to(fmap)

    return fmap

def main() -> None:
    base_dir = Path(__file__).resolve().parent.parent
    input_csv = base_dir / "output" / "ground_track.csv"
    output_html = base_dir / "output" / "ground_track_map.html"

    if not input_csv.exists():
        raise FileNotFoundError(f"입력 파일이 없습니다.: {input_csv}")

    df = pd.read_csv(input_csv)
    validate_columns(df)

    fmap = build_map(df)
    fmap.save(output_html)

    print(f"지도 저장 완료: {output_html}")

if __name__ == "__main__":
    main()