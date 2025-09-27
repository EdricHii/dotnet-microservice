namespace Play.Common.Settings
{
    public class MongoDbSettings
    {
        public string Host { get; set; } = "localhost";
        public int Port { get; set; } = 27017;

        public string ConnectionString => $"mongodb://{Host}:{Port}";
    }
}