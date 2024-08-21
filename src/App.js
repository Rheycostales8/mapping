import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const customerAccounts = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "123456",
        name: "Dante Gulapa",
      },
      geometry: {
        type: "Point",
        coordinates: [120.20007821298623, 14.9341642523968, 0.0],
      },
    },
  ],
};

export default function MapboxExample() {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [coordinates, setCoordinates] = useState();
  const markerRef = useRef(null);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoicmhleXBvZ2kiLCJhIjoiY20wMmYybW5tMDBpNTJqb3JvYTZjYWludSJ9.muEBzCe8YyI1bZatYU0wKw";

    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [120.20008552927487, 14.934168555739369],
      zoom: 16,
    });

    //dragabble
    const markera = new mapboxgl.Marker({
      draggable: true,
      color: "orange",
    })
      .setLngLat([120.20008552927487, 14.934168555739369])
      .addTo(mapRef.current);

    function onDragEnd() {
      const lngLat = markera.getLngLat();
      setCoordinates([`Longitude: ${lngLat.lng}`, `Latitude: ${lngLat.lat}`]);
    }

    markera.on("dragend", onDragEnd);

    //clustering
    mapRef.current.on("load", () => {
      if (!mapRef.current.getSource("earthquakes")) {
        mapRef.current.addSource("earthquakes", {
          type: "geojson",
          data: customerAccounts,
          cluster: true,
          clusterMaxZoom: 16,
          clusterRadius: 50,
        });
      }

      mapRef.current.addLayer({
        id: "clusters",
        type: "circle",
        source: "earthquakes",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#51bbd6",
            100,
            "#f1f075",
            750,
            "#f28cb1",
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            100,
            30,
            750,
            40,
          ],
        },
      });

      mapRef.current.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "earthquakes",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
      });

      mapRef.current.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "earthquakes",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#11b4da",
          "circle-radius": 8,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff",
        },
      });

      // inspect a cluster on click
      mapRef.current.on("click", "clusters", (e) => {
        const features = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        const clusterId = features[0].properties.cluster_id;
        mapRef.current
          .getSource("earthquakes")
          .getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;

            mapRef.current.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom,
            });
          });
      });

      // When a click event occurs on a feature in
      // the unclustered-point layer, open a popup at
      // the location of the feature, with
      // description HTML from its properties.
      mapRef.current.on("click", "unclustered-point", (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const mag = e.features[0].properties.id;
        const name = e.features[0].properties.name;

        // Ensure that if the map is zoomed out such that
        // multiple copies of the feature are visible, the
        // popup appears over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`Name: ${name}<br>Account Number: ${mag}`)
          .addTo(mapRef.current);
      });

      mapRef.current.on("mouseenter", "clusters", () => {
        mapRef.current.getCanvas().style.cursor = "pointer";
      });
      mapRef.current.on("mouseleave", "clusters", () => {
        mapRef.current.getCanvas().style.cursor = "pointer";
      });
    });
    // return () => mapRef.current.remove();
  }, []);

  handleSearchClick = () => {
    //pulsej
    const size = 120;
    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    const pulsingDot = {
      width: size,
      height: size,
      data: new Uint8Array(size * size * 4),

      onAdd: function () {
        const canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext("2d");
      },

      render: function () {
        const duration = 1000;
        const t = (performance.now() % duration) / duration;

        const radius = (size / 2) * 0.3;
        const outerRadius = (size / 2) * 0.7 * t + radius;
        const context = this.context;

        context.clearRect(0, 0, this.width, this.height);
        context.beginPath();
        context.arc(
          this.width / 2,
          this.height / 2,
          outerRadius,
          0,
          Math.PI * 2
        );
        context.fillStyle = `rgba(255, 200, 200, ${1 - t})`;
        context.fill();

        context.beginPath();
        context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
        context.fillStyle = "rgba(255, 100, 100, 1)";
        context.strokeStyle = "white";
        context.lineWidth = 2 + 4 * (1 - t);
        context.fill();
        context.stroke();

        this.data = context.getImageData(0, 0, this.width, this.height).data;

        mapRef.current.triggerRepaint();

        return true;
      },
    };

    mapRef.current.addImage("pulsing-dot", pulsingDot, { pixelRatio: 2 });

    if (mapRef.current.getLayer("layer-with-pulsing-dot")) {
      mapRef.current.removeLayer("layer-with-pulsing-dot");
    }

    // Check if the source "dot-point" exists and remove it
    if (mapRef.current.getSource("dot-point")) {
      mapRef.current.removeSource("dot-point");
    }

    mapRef.current.addSource("dot-point", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: coordinates,
            },
          },
        ],
      },
    });

    mapRef.current.setCenter(coordinates).setZoom(18);

    mapRef.current.addLayer({
      id: "layer-with-pulsing-dot",
      type: "symbol",
      source: "dot-point",
      layout: {
        "icon-image": "pulsing-dot",
      },
    });
  };

  return (
    <div>
      <div ref={mapContainerRef} style={{ height: "500px", width: "900px" }}>
        {/* Adjust height as needed */}
      </div>
      <div
        style={{
          background: "rgba(0, 0, 0, 0.5)",
          color: "#fff",
          position: "absolute",
          top: "10px",
          left: "10px",
          padding: "5px 10px",
          margin: 0,
          fontFamily: "monospace",
          fontWeight: "bold",
          fontSize: "11px",
          lineHeight: "18px",
          borderRadius: "3px",
          display: coordinates ? "block" : "none",
        }}
      >
        {coordinates &&
          coordinates.map((coord) => (
            <p style={{ marginBottom: 0 }}>{coord}</p>
          ))}
      </div>
      <input
        type="text"
        placeholder="Enter latitude"
        value={latitude}
        onChange={(e) => setLatitude(e.target.value)}
      />
      <input
        type="text"
        placeholder="Enter longitude"
        value={longitude}
        onChange={(e) => setLongitude(e.target.value)}
      />

      <button
        onClick={handleSearchClick}
        style={{ border: "2px solid blue", marginTop: "10px" }}
      >
        Search
      </button>
    </div>
  );
}
