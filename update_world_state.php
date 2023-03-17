<?php
    ini_set('memory_limit', '1024M');
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $post = file_get_contents('php://input');
    //echo $post;
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
    //echo 'Connected Successfully';
    try{
        $conn->autocommit(FALSE);

        $stmt1 = $conn->prepare("DELETE FROM world_state");
        $stmt1->execute();

        $stmt2 = $conn->prepare("INSERT INTO world_state (data, time) VALUES (?, ?)");
        $stmt2->bind_param("sd", $post, $time);
        $stmt2->execute();

        $conn->commit();
        
    } catch (Exception $e){
        error_log($e->getMessage(), 0);
        error_log($post, 0);
        $conn->rollback();
    }
    $conn->close();
?>