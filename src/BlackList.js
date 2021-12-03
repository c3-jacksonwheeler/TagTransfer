let Blacklist = {
	main: ['SetupWorkingDirPerformanceProfile','BundleStatus','SamlServiceProvider','Import','DataLoadUploadLog','SourceFile','ExportImportChunk','DynamoDBAutoScalingLog','DbImage','JobHistory','SqlActionQueueEntry','MetadataPackageBuild','InvalidationQueueErrorReviewComment','TargetStatus','HealthCheckLog','SqlWorkflowQueueEntry','InvalidationQueueErrorReview','DbMetadataIssue','HardwareProfile','JupyterContent','SqlFileDataQueueEntry','JupyterFile','DbMetadataFile','SqlSourceCollection','FileDataIndexLock','DbLockEntry','SqlHierDenormQueueEntry','CronJob','SqlHierDenormQueueEntry','Translation','SqlSourceStatusQueueEntry','SourceStatus','UiBundlerResult','WebpackPerformanceProfile','SamlProfile','MetadataRepositoryBuild','JupyterDirectory','WorkflowWaitStepRun','InvalidationQueueLock','ReduceResult','InvalidationQueuePaused','WorkflowActionStepRun','SqlAnalyticsQueueEntry','JobRunErrorDetail','WorkflowRun','MapReduceRun','Observation','PathId','InvalidationQueueError','DataLoadProcessLog','BatchJobRun','NextId','WorkflowStepRun','DataIntegStatus','MetadataRepositoryStore','SqlCronQueueEntry','SqlKafkaQueueEntry','SqlChangeLogQueueEntry','SqlBatchQueueEntry','DataIssue','SqlMapReduceQueueEntry','JupyterNotebook','FileSystemBatchJob','X12ParserProperties','SchemaMigrationVersion','SourceCollection','AwsCloudWatchDimensions','MetricDependency','SimpleMetric','CompoundMetric','TenantTagId','EnvReport','SourceContent','SourceChunk','SourceChunkStatus','VanityUrl', 'User', 'OktaGroupMigrate', 'BatchInValue', 'MapInValue', 'Tag','Tenant','ClusterEventLog','Idp','TagProvisionLog','TokenKey','SamlSettings','CassandraTableStats','OAuthAccess','TypeId','SqlCalcFieldsQueueEntry','MapResult','GitHubToken','SignatureKey'],
	measurements: ['PointMeasurement','Measurement','RegisterMeasurement','BasePhysicalMeasurementSeries','MeasurementSeries','PhysicalMeasurementSeries','MeasurementSeriesStats'],
	ds:  ['MLSerialPipeline','MLPipeline','MLPipeBase'],
	mergeProblems: ['TimeZoneUpdater','WeatherDataUpdater','WeatherDataResult','WeatherStation','ZipLatLong','UnitOfConversion']

}


function getTypeBlacklist(fetchMeasurements=false){
	let b = Blacklist.main;
	if(!fetchMeasurements){
		b = b.concat(Blacklist.measurements)
	}
	b = b.concat(Blacklist.ds)
	b = b.concat(Blacklist.mergeProblems);

	return b

}

module.exports = {Blacklist, getTypeBlacklist}