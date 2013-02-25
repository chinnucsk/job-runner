var jobrunnerServices = angular.module('jobrunner.services', ['project', 'job', 'jobTemplate', 'run']);

jobrunnerServices.value('dtformat', {
    formatDuration: function(startDts, endDts) {
        if (startDts !== null && endDts !== null) {
            var start = moment(startDts);
            var end = moment(endDts);
            var duration = moment.duration(end.diff(start));

            return duration.days() + 'd, ' + duration.hours() + 'h, ' + duration.minutes() + 'min, ' + duration.seconds() + 'sec ';
        }
    },

    getDurationInSec: function(startDts, endDts) {
        if (startDts !== null && endDts !== null) {
            var start = moment(startDts);
            var end = moment(endDts);
            var duration = moment.duration(end.diff(start));

            var output = duration.seconds();
            output = output + duration.days() * 24 * 60 * 60;
            output = output + duration.hours() * 60 * 60;
            output = output + duration.minutes() * 60;

            return output;
        }
    },

    formatDateTime: function(dateTimeString) {
        if (dateTimeString !== null) {
            return moment(dateTimeString).format('YYYY-MM-DD HH:mm:ss');
        }
    }

});

jobrunnerServices.factory('globalCache', function($cacheFactory) {
    var globalCache = $cacheFactory('globalCache');
    return globalCache;
});


jobrunnerServices.factory('globalState', function(Project, Job, JobTemplate, Run, Worker, globalCache) {
    return {
        data : {
            project: null,
            projectId: null,
            page: null,
            jobs: null,
            jobTab: 'details',
            jobTemplates: null,
            jobFilter: {},
            runs: null,
            wsConnected: false
        },

        setProjectId: function(projectId) {
            if (!this.data.projectId || this.data.projectId != projectId) {
                this.data.projectId = projectId;

                // reset all data
                globalCache.removeAll();
                this.data.project = null;
                this.data.jobs = null;
                this.data.jobTemplates = null;
                this.data.runs = null;
            }
        },

        initialize: function(projectId, callback) {
            var self = this;

            if (!this.data.projectId || this.data.projectId != projectId) {
                this.data.projectId = projectId;

                // reset all data
                globalCache.removeAll();

                this.data.project = null;
                this.data.jobs = null;
                this.data.jobTemplates = null;
                this.data.runs = null;

                // cache all jobs
                Job.all({project_id: this.data.projectId}, function(jobs) {
                    globalCache.put('job.all', jobs);
                    angular.forEach(jobs, function(job) {
                        globalCache.put('job.' + job.id, job);
                    });

                    // cache all job-templates
                    JobTemplate.all({project_id: self.data.projectId}, function(jobTemplates) {
                        globalCache.put('jobTemplate.all', jobTemplates);
                        angular.forEach(jobTemplates, function(template) {
                            globalCache.put('jobTemplate.' + template.id, template);
                        });

                        // cache all workers
                        Worker.all({project_id: self.data.projectId}, function(workers) {
                            globalCache.put('worker.all', workers);
                            angular.forEach(workers, function(worker) {
                                globalCache.put('worker.' + worker.id, worker);
                            });
                            callback();
                        });
                    });
                });
            } else {
                callback();
            }
        },

        getProject: function() {
            if (this.data.project) {
                return this.data.project;
            } else {
                this.data.project = Project.get({id: this.data.projectId});
                return this.data.project;
            }
        },

        getAllJobs: function(success) {
            if (this.data.jobs) {
                return this.data.jobs;
            } else {
                this.data.jobs = Job.all({project_id: this.data.projectId}, success);
                return this.data.jobs;
            }
        },

        getAllJobTemplates: function() {
            if (this.data.jobTemplates) {
                return this.data.jobTemplates;
            } else {
                this.data.jobTemplates = JobTemplate.all({project_id: this.data.projectId});
                return this.data.jobTemplates;
            }
        },

        getRuns: function() {
            if (this.data.runs) {
                return this.data.runs;
            } else {
                this.data.runs = [];
                var self = this;

                Run.all({state: 'scheduled', project_id: this.data.projectId}, function(scheduled) {
                    angular.forEach(scheduled, function(run) {
                        self.data.runs.push(run);
                    });
                });

                Run.all({state: 'in_queue', project_id: this.data.projectId}, function(inQueue) {
                    angular.forEach(inQueue, function(run) {
                        self.data.runs.push(run);
                    });
                });

                Run.all({state: 'started', project_id: this.data.projectId}, function(started) {
                    angular.forEach(started, function(run) {
                        self.data.runs.push(run);
                    });
                });

                Job.all({project_id: this.data.projectId}, function(jobs) {
                    angular.forEach(jobs, function(job) {
                        var runs = Run.query({job: job.id, limit: 1, state: 'completed'}, function() {
                            angular.forEach(runs, function(run) {
                                self.data.runs.push(run);
                            });
                        });
                    });
                });

                return this.data.runs;
            }
        }
    };
});
