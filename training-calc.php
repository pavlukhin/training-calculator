<?php
/**
 * @package Training_Calculator
 * @version 0.1 
 */
/*
Plugin Name: Training calculator
Description: Training calculator
Author: Calisthenics School
Version: 0.1
Author URI: https://calisthenics.school/
*/
function training_calc_add_settings_page() {
    add_options_page('Training calculator', 'Training calculator', 'manage_options', 'training-calculator-plugin', 'training_calculator_render_settings_page');
}

add_action('admin_menu', 'training_calc_add_settings_page');

function training_calc_settings_init() {
    register_setting('training-calculator-plugin', 'training_calc_options');
    add_settings_section('training_calculator_section1', 'Section 1', '', 'training-calculator-plugin');
    add_settings_field('training_calculator_pages', 'Enabled for pages', 'tcalc_pages_field_callback', 'training-calculator-plugin', 'training_calculator_section1');
}

add_action('admin_init', 'training_calc_settings_init');

function training_calculator_render_settings_page() {
    ?>
    <h3>Training calculator settings</h3>
    <form action="options.php" method="post">
        <?php
        settings_fields('training-calculator-plugin');
        do_settings_sections('training-calculator-plugin');
        submit_button('Save');
        ?>
    </form>
    <?php
}

function tcalc_pages_field_callback() {
    tcalc_setting_field_callback('on_pages');
}

function tcalc_setting_field_callback($key) {
    $setting = get_option('training_calc_options')[$key];
    ?>
    <input type="text" name="training_calc_options[<?php echo $key; ?>]" value="<?php echo esc_attr($setting); ?>">
    <?php
}

function generate_training_calculator() {
    if (get_post()->post_name != get_option('training_calc_options')['on_pages']) {
        return;
    }
    ?>
        <style>
            <?php print_file_content('calculator.css'); ?>
        </style>
        <script src="https://unpkg.com/mustache@latest"></script>

        <script>
            <?php print_file_content('calculator.js'); ?>

            function initCalculator() {
                var root = document.getElementById('dynamicCalculatorContainer');
                if (root) {
                    var model = JSON.parse('<?php print_model_json(); ?>');
                    generateCalculator(model, root, {
                        weekTemplate: <?php print_html_template('week-template.html') ?>,
                        repTemplate: <?php print_html_template('rep-template.html') ?>,
                        restRepTemplate: <?php print_html_template('rest-rep.html') ?>,
                        restExTemplate: <?php print_html_template('rest-ex.html') ?>
                    });
                }
            }

            initCalculator();
        </script>
    <?php
}

function print_html_template($fileName) {
    echo '\'' . preg_replace('/\n|\r/', '', file_get_contents(plugin_dir_path(__FILE__) . $fileName)) . '\'';
}

function print_model_json() {
    echo preg_replace('/\n|\r/', '', file_get_contents(plugin_dir_path(__FILE__) . 'training-model.json'));
}

function print_file_content($fileName) {
    echo file_get_contents(plugin_dir_path(__FILE__) . $fileName);
}

add_action('wp_footer', 'generate_training_calculator');
