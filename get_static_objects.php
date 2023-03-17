<?php
    $servername = "localhost:3307";
    $username = "root";
    $password = "";
    $db = "star_wars_project_db";
    //set the details for the webserver

    // Create connection
    $conn = new mysqli($servername, $username, $password, $db);

    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $query = "SELECT * FROM static_objects";
    $result = $conn->query($query);

    if ($result->num_rows > 0)
    {
        // OUTPUT DATA OF EACH ROW
        while($row = $result->fetch_assoc())
        {
            echo $row["data"];
        }
    }

    $conn->close();
?>