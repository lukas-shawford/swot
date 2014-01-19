"use strict";

angular.module('swot').directive('ckedit', function ($parse) {
    CKEDITOR.disableAutoInline = true;
    var counter = 0,
    prefix = '__ckd_';
 
    return {
        restrict: 'A',
        link: function (scope, element, attrs, controller) {
            var getter = $parse(attrs.ckedit),
                setter = getter.assign;
 
            attrs.$set('contenteditable', true); // inline ckeditor needs this
            if (!attrs.id) {
                attrs.$set('id', prefix + (++counter));
            }

            // Function to update the model based on editor contents. Requires the 'event' argument
            // passed by CKEditor-generated events.
            var updateModel = function (e) {
                if (e.editor.checkDirty()) {
                    var ckValue = e.editor.getData();
                    
                    // Normally, we would want to wrap the call to the setter inside of a
                    // scope.$apply block (because we are responding to an event that did not
                    // originate from within AngularJS). Doing so would have the effect of
                    // triggering any $watch handlers for the model value we're setting. However,
                    // this is precisely what we are trying to avoid here - the $watch handler
                    // updates the contents of the ckEditor instance based on the model value by
                    // calling setData(), which is:
                    // 
                    //     - Unnecessary, because this code block is already an event handler for
                    //       the editor contents being updated - that's where the change originated
                    //       from, so we just need to update the model based on the editor contents.
                    //       There's no need to sync that change back again to the editor afterward.
                    //
                    //     - Problematic, because the way we update the editor contents is by
                    //       calling setData(), which has the side effect of resetting the cursor
                    //       position to the very beginning of the editor. This results in the
                    //       cursor effectively being "stuck" at the beginning
                    //
                    // Thus, just call the setter normally, without using scope.$apply - this will
                    // update the model based on the editor contents, without syncing the changes
                    // back.
                    //       
                    setter(scope, ckValue);
                    
                    ckValue = null;
                    e.editor.resetDirty();
                }
            };
 
            // CKEditor stuff
            // Override the normal CKEditor save plugin
 
            CKEDITOR.plugins.registered['save'] =
            {
                init: function (editor) {
                    editor.addCommand('save',
                        {
                            modes: { wysiwyg: 1, source: 1 },
                            exec: function (editor) {
                                if (editor.checkDirty()) {
                                    var ckValue = editor.getData();
                                    scope.$apply(function () {
                                        setter(scope, ckValue);
                                    });
                                    ckValue = null;
                                    editor.resetDirty();
                                }
                            }
                        }
                    );
                    editor.ui.addButton('Save', { label: 'Save', command: 'save', toolbar: 'document' });
                }
            };
            var options = {};
            options.on = {
                blur: updateModel,
                change: updateModel
            };
            //options.extraPlugins = 'sourcedialog';
            //options.removePlugins = 'sourcearea';
            options.title = false;
            var editorangular = CKEDITOR.inline(element[0], options); //invoke
 
            scope.$watch(attrs.ckedit, function (value) {
                editorangular.setData(value);
            });
        }
    }
 
});
