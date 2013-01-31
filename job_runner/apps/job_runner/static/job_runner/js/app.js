var globalState = null;

angular.module('jobrunner', ['project', 'job', 'jobTemplate', 'worker', 'run']).config(function($routeProvider, $locationProvider) {
    globalState = {
        project: null,
        page: null,
        jobs: null,
        job_templates: null,
        job_filter: {
            reschedule_interval_type: ''
        }
    };

    $locationProvider.html5Mode(true);

    $routeProvider.
        when('/project/:project/runs/', {controller: RunsCtrl, templateUrl: '/static/job_runner/templates/runs.html'}).
        when('/project/:project/jobs/', {controller: JobListCtrl, templateUrl: '/static/job_runner/templates/job_list.html'}).
        when('/project/:project/jobs/:job/', {controller: JobListCtrl, templateUrl: '/static/job_runner/templates/job_list.html'});

});
