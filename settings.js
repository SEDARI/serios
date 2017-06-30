module.exports = {
    server: {
        tls: false,
        host: "127.0.0.1",
        port: 3003,
        cluster: 0
    },
    rest: {
        prefix: "serios"
    },
    storage: {
        type: "mongodb",
        host: "localhost",
        port: "27017",
        dbname: "serios-database",
        user: "serios",
        password: "serios",
        max_number_of_sensor_data_saved : 10000,
        max_duration_of_sensor_data_saved: {
            value: 30,
            // one of 'seconds', 'minutes', 'hours', 'days'.
            timeunit: "days"
        },
        testdbname: "serios-test",
        testuser: "seriosTest",
        testpassword: "seriosTest"
    }
};
