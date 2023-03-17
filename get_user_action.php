<?php
    $post = file_get_contents('php://input');
    $servername = "localhost:3307";
    $username = "root";
    $password = "";
    $db = "star_wars_project_db";
    //$time = microtime(true);

    // Create connection
    $conn = new mysqli($servername, $username, $password, $db);

    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $query = "SELECT * FROM user_actions WHERE time > $post ORDER BY time ASC";
    $result = $conn->query($query);

    header("time: " . $post);

    if ($result->num_rows > 0)
    {
        $items = array();
        // OUTPUT DATA OF EACH ROW
        while($row = $result->fetch_assoc())
        {
            array_push($items, $row["data"]);
            header("time: " . $row["time"]);

        }
        echo json_encode($items);
    }

    $conn->close();
?>