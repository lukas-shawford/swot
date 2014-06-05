angular.module('swot').controller('EditQuizCtrl', function (quiz, $scope, $timeout, focus, $debounce) {
    $scope.quiz = {
        _id: _quizId || null,
        name: "",
        topic: url('?topic'),
        questions: [{ type: 'FillInQuestion' }]
    };
    $scope.alerts = [];
    $scope.finishedLoading = false;
    $scope.saveStatus = "";
    $scope.saveStatusTimeout = null;
    $scope.saveError = "";
    $scope.isSaving = false;
    $scope.savedSuccessfully = true;

    // Keep track of when a new question is being added. This is flipped to true when user clicks on
    // Add Question (or adds a question by hitting TAB), and stays true until the question editor
    // has finished loading.
    $scope.addingNewQuestion = false;
    
    $scope.isNew = function () {
        return $scope.quiz._id === null;
    };

    $scope.load = function () {
        quiz.load($scope.quiz._id, function (response) {
            $scope.quiz = response.quiz;

            // Use a timeout as a hacky way to prevent the add question animations from running on
            // all the questions in the quiz upon initial load. We just want the animations to run
            // on newly-added questions.
            $timeout(function () {
                $scope.finishedLoading = true;
            }, 1);

            // Prevent jumpiness when reordering questions. (See $scope.updateFormHeight for longer
            // explanation of what this is about. Note that we also update min-height from within
            // the $scope.$watchCollection() call at the bottom, but if the quiz was slow to load,
            // then the min-height value will be incorrect because it was set too early - hence, set
            // it here after an additional delay.)
            $timeout($scope.updateFormHeight, 1200);
            
        }, function (error) {
            $scope.showError('An error occurred while loading the quiz: \n' + error);
        });
    };

    $scope.save = function (callback) {
        if ($scope.isSaving) { return; }

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
                $scope.saveStatusTimeout = null;
            }, 2000);
            if (typeof (callback) === 'function') {
                callback(true);
            }
            $scope.editQuizForm.$setPristine();
        };

        var onError = function (error) {
            $scope.saveStatus = "";
            $scope.showError('An error occurred while saving the quiz: ' + error);
            $scope.savedSuccessfully = false;
            $scope.isSaving = false;
            if (typeof (callback) === 'function') {
                callback(false);
            }
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
        $scope.quiz.questions.push({
            type: 'FillInQuestion',
            questionHtml: '',
            answer: '',
            ignoreCase: true,
            alternativeAnswers: []
        });

        // Flip this to true to denote that we're currently initializing a new question editor
        // instance. Below, we're listening for the "editorReady" event (fired by ckedit directive,
        // defined in ngCkEditor.js) which signifies that CKEditor has finished loading, at which
        // point we set focus to the newly added question and flip this back to false.
        $scope.addingNewQuestion = true;

        // Initially set focus to the Add Question button rather than the question editor. We should
        // only set focus to the question editor after CKEditor has finished loading and the new
        // question animation has finished playing; otherwise, we'll encounter issues with the
        // CKEditor toolbar jittering, and the document scrolling in the wrong direction.
        focus('beginAddNewQuestion');

        // Mark the form as dirty
        $scope.editQuizForm.$setDirty();
    };

    $scope.$on('editorReady', function (event, args) {
        // Set focus to the question editor field for the newly-added question once the editor has
        // finished loading. An additional 500ms delay is added so the new question animation can
        // finish playing (slide the question in from the left, expand it vertically, and fade it
        // in). The delay is important because the ckeditor toolbar will not be lined up with the
        // field otherwise.
        if ($scope.addingNewQuestion) {
            $timeout(function () {
                if (!Modernizr.touch) { // Don't autofocus on mobile (keyboard doesn't automatically show anyway)
                    focus('newQuestionReady');
                }
                $scope.addingNewQuestion = false;
            }, 500);
        }
    });

    $scope.removeQuestion = function (index) {

        // To prevent jumpiness after removing the last question, clear the min-height immediately.
        // (See $scope.updateFormHeight for longer explanation of what this is about.)
        $('form[name="editQuizForm"]').css('min-height', '');

        $scope.quiz.questions.splice(index, 1);
        $scope.editQuizForm.$setDirty();
    };

    $scope.copyQuestion = function (index) {
        var question = $scope.quiz.questions[index];
        var copy = JSON.parse(JSON.stringify(question));

        // TODO: Should use a blacklist approach instead of whitelist so that I don't have to update this
        // list every time I add a new field. The properties that I don't want to copy (mostly Angular internals)
        // can be eliminated via a pattern (i.e., don't copy any properties starting with '$' or '_'), and are
        // generally pretty static. On the other hand, I keep adding new fields all the time, and have to
        // remember to update this list, or otherwise copying wouldn't work properly...
        copy = _.pick(copy, 'type', 'questionHtml', 'answer', 'choices', 'correctAnswerIndex', 'ignoreCase',
            'alternativeAnswers', 'supplementalInfoHtml');

        $scope.quiz.questions.splice(index + 1, 0, copy);
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

            // Save a snapshot of the questions array. We'll compare it to see if it changed when
            // the user has finished reordering, and only mark the form as dirty if the order has
            // actually changed.
            $scope.questionsCopyOnStartReorder = $scope.quiz.questions.slice(0);

            // Remove focus from any input elements (should make any open ckeditor toolbars disappear)
            $(ui.item).find('input, textarea, [contentEditable]').blur();

            // Set the placeholder height to match the question's actual (outer) height.
            ui.placeholder.height(ui.item.outerHeight());

            // Change the cursor to a grabbing cursor
            $(ui.item).find('.drag-handle').addClass('grabbing');

            // Everything below here is used for the reordering animations (smoothly move the
            // questions around, instead of having them snap into their new positions). Only the
            // brave should venture here.
            // REFERENCE: http://stackoverflow.com/questions/5060357/jquery-sortable-with-animation/13416536#13416536
            // --------------------------

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
            
            // More code related to animating the transitions when reordering...
            // --------------------------

            var $list = $(ui.item).closest('.ui-sortable');

            // get all invisible items that are also not placeholders
            // and process them when ordering changes...
            $list.children("li:not(.exclude-me, .ui-sortable-placeholder)").each(function() {
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
        sort: function (e, ui) {
            // Show question number within placeholder
            var $list = $(ui.item).closest('.ui-sortable');
            var position = $list.children("li:not(.exclude-me, .ui-sortable-placeholder)").index(ui.placeholder)+1;
            $(ui.placeholder).data('clone').html('<div class="placeholder-number">' + position + '</div>');
        },
        stop: function (e, ui) {

            // Mark the quiz as dirty, but only if the order of questions has actually changed.
            if (!_.isEqual($scope.questionsCopyOnStartReorder, $scope.quiz.questions)) {
                $scope.editQuizForm.$setDirty();
            }

            // Change the cursor to a regular cursor
            $(ui.item).find('.drag-handle').removeClass('grabbing');

            // More code related to animating the transitions when reordering...
            // --------------------------

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

    /**
     * Workaround to prevent the page from jumping around when reordering questions.
     *
     * When reordering questions, we hide the original question list and create a shadow list in its place
     * (see above, in $scope.sortableOptions). This tearing up of the DOM can cause the scrollbar to jump
     * if we're trying to move a question that's down toward the bottom of the list (because the page
     * temporarily shrinks). We prevent this by setting a min-height on the entire form (and constantly
     * keeping it updated - see the $scope.$watchCollection call below).
     *
     * This isn't pretty nor performant, but less drastic solutions have failed. I'm not sure why, but
     * trying to set the min-height when beginning a drag operation (in the 'start' handler for
     * sortableOptions, for instance) didn't work. Also, setting the min-height on the
     * <div class="question-list-container"> or even the <ul> containing the questions didn't work
     * either.
     */
    $scope.updateFormHeight = function () {
        var $form = $('form[name="editQuizForm"]');

        // Clear the height (allows the form to shrink if questions are deleted)
        $form.css('min-height', '');

        // Re-measure the height and lock it in.
        $form.css('min-height', $form.outerHeight() + 'px');
    };

    // Question Editor (ckeditor)
    // --------------------------

    $scope.ckFullToolbar = [
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
    ];

    // On smaller screens, show a stripped down version of the toolbar
    // with only basic formatting options.
    $scope.ckMobileToolbar = [
        { name:  'formatting',
          items: [  'Bold', 'Italic', 'Underline',
                    '-',
                    'TextColor', 'BGColor', 'FontSize',
                    '-',
                    'RemoveFormat'
                    ] },
    ];

    $scope.ckEditorConfig = {
        toolbar : ($(window).width() > 600 ? $scope.ckFullToolbar : $scope.ckMobileToolbar)
    };


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

    $scope.answerKeypress = function ($event, question) {
        // Add new question when hitting TAB on the last input
        var index = $scope.quiz.questions.indexOf(question);
        if (index === $scope.quiz.questions.length - 1) {
            if ($event.keyCode === 9 &&  !$event.ctrlKey && !$event.metaKey && !$event.altKey && !$event.shiftKey) {
                $scope.addQuestion();
            }
        }
    };


    // Initialization
    // --------------

    if ($scope.quiz._id) { $scope.load(); }
    else { $scope.finishedLoading = true; }


    // Watches
    // -------

    // Watch for any changes within the quiz. Trigger autosave if anything changes.
    $scope.$watch('quiz', $debounce($scope.autosave, 1000), true);

    // Watch for changes in the questions array and update the form height if any questions are
    // added or removed.
    $scope.$watchCollection('quiz.questions', $debounce($scope.updateFormHeight, 800));

    // Opening/closing the settings on any question also affects the total height of the form.
    $scope.$on('settingsOpened', $scope.updateFormHeight);
    $scope.$on('settingsClosed', $scope.updateFormHeight);
});
