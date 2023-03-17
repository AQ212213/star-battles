<?php

    $post = file_get_contents('php://input');
    $servername = "localhost:3307";
    $username = "root";
    $password = "";
    $db = "star_wars_project_db";
    $time = microtime(true);

    // Create connection
    $conn = new mysqli($servername, $username, $password, $db);

    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $stmt = $conn->prepare("INSERT INTO user_actions (data, time) VALUES (?, ?)");
    $stmt->bind_param("sd", $post, $time);
    $stmt->execute();

    $conn->close();
?>