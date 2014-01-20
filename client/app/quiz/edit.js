angular.module('swot').controller('EditQuizCtrl', function (quiz, $scope, $timeout, focus, $debounce) {
    $scope.quiz = {
        _id: _quizId || null,
        name: "",
        questions: [{}]
    };
    $scope.alerts = [];
    $scope.saveStatus = "";
    $scope.saveStatusTimeout = null;
    $scope.saveMessage = "";
    $scope.isSaving = false;
    $scope.savedSuccessfully = true;
    $scope.addQuestionTooltipsRemaining = 2;    // Stop showing the tooltip after adding a couple questions.
    
    $scope.isNew = function () {
        return $scope.quiz._id === null;
    }

    $scope.load = function () {
        quiz.load($scope.quiz._id, function (response) {
            $scope.quiz = response.quiz;
        }, function (error) {
            $scope.showError('An error occurred while loading the quiz: \n' + error);
        });
    };

    $scope.save = function (callback) {
        $scope.closeAllAlerts();
        $scope.isSaving = true;

        if ($scope.saveStatusTimeout !== null) {
            $timeout.cancel($scope.saveStatusTimeout);
        }

        var onSaveFinished = function () {
            $scope.saveStatus = "Saved";
            $scope.savedSuccessfully = true;
            $scope.isSaving = false;
            $scope.saveStatusTimeout = $timeout(function () {
                $scope.saveStatus = "";
            }, 2000);
            if (typeof (callback) === 'function') {
                callback(true);
            };
            $scope.editQuizForm.$setPristine();
        };

        var onError = function (error) {
            $scope.saveStatus = "";
            $scope.saveMessage = 'An error occurred while saving the quiz: ' + error;
            $scope.savedSuccessfully = false;
            $scope.isSaving = false;
            if (typeof (callback) === 'function') {
                callback(false);
            };
        };

        if ($scope.isNew()) {
            quiz.create($scope.quiz, function (id) {
                $scope.quiz._id = id;
                onSaveFinished();
            }, onError);
        } else {
            quiz.save($scope.quiz, onSaveFinished, onError);
        }
    };

    $scope.autosave = function () {
        if ($scope.editQuizForm.$dirty) { $scope.save(); }
    };

    $scope.deleteQuiz = function () {
        $scope.closeAllAlerts();

        quiz.deleteQuiz($scope.quiz._id, function () {
            bootbox.alert("The quiz has been deleted successfully.", function () {
                window.location.href = "/quizzes";
            });
        }, function (error) {
            $scope.showError("An error occurred while deleting the quiz: " + error);
        });
    };

    $scope.addQuestion = function () {
        $scope.quiz.questions.push({});

        // Focus on the first input field for the newly-added question
        focus('newQuestionAdded');

        // Mark the form as dirty
        $scope.editQuizForm.$setDirty();

        // Stop showing the tooltip on the Add Question button after adding a couple questions
        // Note that tooltip is now shown where there are no questions, so adding the first question
        // should not decrement the count.
        if ($scope.quiz.questions.length > 1) {
            $scope.addQuestionTooltipsRemaining--;
        }
    };

    $scope.removeQuestion = function (index) {
        $scope.quiz.questions.splice(index, 1);
        $scope.editQuizForm.$setDirty();
    };

    $scope.exportJson = function () {
        bootbox.confirm('The quiz will be saved before exporting. Continue?', function (confirmed) {
            if (confirmed) {
                $scope.save(function (success) {
                    if (success) {
                        location.href = '/export?id=' + $scope.quiz._id;
                    }
                });
            }
        });
    };

    $scope.sortableOptions = {
        update: function(e, ui) { },
        placeholder: 'sortable-list-placeholder',
        handle: '.drag-handle',
        forcePlaceholderSize: true,
        start: function (e, ui) {
            ui.placeholder.height(ui.item.outerHeight());

            var $list = $(ui.item).closest('.ui-sortable');

            // Clear any previous shadow lists
            $('.shadow-list').remove();

            // Create a shadow list by cloning the original
            var $shadow = $('<ul></ul>', {
                'class': 'shadow-list'
            });
            $list.after($shadow);

            // Loop over the original list items...
            $list.children("li").each(function() {

                // clone the original items to make their
                // absolute-positioned counterparts...
                var item = $(this);
                var item_clone = item.clone();

                // 'store' the clone for later use...
                item.data("clone", item_clone);

                // set the initial position/size of the clone
                var position = item.position();
                item_clone.css("left", position.left);
                item_clone.css("top", position.top);
                item_clone.width(item.outerWidth());

                // append the clone...
                $shadow.append(item_clone);
            });

            // loop through the items, except the one we're
            // currently dragging, and hide it...
            ui.helper.addClass("exclude-me");
            $list.children("li:not(.exclude-me)").css("visibility", "hidden");

            // get the clone that's under it and hide it...
            ui.helper.data("clone").hide();
        },
        change: function(e, ui) {
            $scope.editQuizForm.$setDirty();

            var $list = $(ui.item).closest('.ui-sortable');

            // get all invisible items that are also not placeholders
            // and process them when ordering changes...
            $list.find("li:not(.exclude-me, .ui-sortable-placeholder)").each(function() {
                var item = jQuery(this);
                var clone = item.data("clone");

                // stop current clone animations...
                clone.stop(true, false);

                // get the invisible item, which has snapped to a new
                // location, get its position, and animate the visible
                // clone to it...
                var position = item.position();
                clone.animate( { left: position.left, top:position.top }, 500);
            });
        },
        stop: function (e, ui) {
            var $list = $(ui.item).closest('.ui-sortable');

            // get the item we were just dragging, and
            // its clone, and adjust accordingly...
            $list.children("li.exclude-me").each(function(){
                var item = $(this);
                var clone = item.data("clone");
                var position = item.position();

                // move the clone under the item we've just dropped...
                clone.css("left", position.left);
                clone.css("top", position.top);
                clone.show();

                // remove unnecessary class...
                item.removeClass("exclude-me");

                // Remove the "position: relative;" style that was added to the item - otherwise,
                // this item will look wrong when reordering things a second time.
                item.css("position", "");
            });

            // make sure all our original items are visible again...
            $list.children("li").css("visibility", "visible");

            // Remove the shadow list
            $('.shadow-list').remove();
        }
    };

    $scope.ckEditorConfig = {
        toolbar : [
            { name:  'lists_and_indentation',
              items: [  'NumberedList', 'BulletedList', 'Outdent', 'Indent', 'Blockquote',
                        '-',
                        'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock',
                        '-',
                        'Link', 'Unlink', '-' ] },

            { name:  'tables_and_images',
              items: [  'Image', 'Table', 'HorizontalRule', 'SpecialChar' ] },

            '/',

            { name:  'formatting',
              items: [  'Bold', 'Italic', 'Underline',
                        '-',
                        'TextColor', 'BGColor',
                        '-',
                        'Superscript', 'Subscript', 'Strike',
                        '-',
                        'RemoveFormat' , 'Font', 'FontSize'
                        ] },
        ]
    };

    $scope.addQuestionTooltip = function () {
        if ($scope.addQuestionTooltipsRemaining <= 0 || $scope.quiz.questions.length == 0) {
            return "";
        }

        return "You can also add a question by hitting the TAB key after typing in the last answer.";
    }


    // Alerts
    // ------

    $scope.showError = function (message) {
        return $scope.alerts.push({ type: 'danger', msg: message }) - 1;
    };

    $scope.showSuccess = function (message) {
        return $scope.alerts.push({ type: 'success', msg: message }) - 1;
    };

    $scope.showInfo = function (message) {
        return $scope.alerts.push({ type: 'info', msg: message }) - 1;
    };

    $scope.showWarning = function (message) {
        return $scope.alerts.push({ type: 'warning', msg: message }) - 1;
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.closeAllAlerts = function() {
        $scope.alerts = [];
    };


    // Events
    // ------

    $scope.answerKeypress = function ($index, $event) {
        // Add new question when hitting TAB on the last input
        if ($index === $scope.quiz.questions.length - 1) {
            if ($event.keyCode === 9 &&  !$event.ctrlKey && !$event.metaKey && !$event.altKey && !$event.shiftKey) {
                $scope.addQuestion();
            }
        }
    }


    // Initialization
    // --------------

    if ($scope.quiz._id) { $scope.load(); }

    $scope.$watch('quiz', $debounce($scope.autosave, 1000), true);
});
