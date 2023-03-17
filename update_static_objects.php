<?php

    $post = file_get_contents('php://input');
    $servername = "localhost:3307";
    $username = "root";
    $password = "";
    $db = "star_wars_project_db";

    // Create connection
    $conn = new mysqli($servername, $username, $password, $db);

    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $query = "DELETE FROM static_objects";
    $result = $conn->query($query);

    $stmt = $conn->prepare("INSERT INTO static_objects (data) VALUES (?)");
    $stmt->bind_param("s", $post);
    $stmt->execute();

    $conn->close();
?>