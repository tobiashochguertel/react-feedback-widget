@element-selection @core
Feature: Element Selection
  As a user
  I want to select specific page elements with my feedback
  So that I can precisely identify which component I'm reporting about

  Background:
    Given user is on a page with the feedback widget enabled
    And user has opened the feedback modal

  # User Story: US004 - Select Page Element
  # Priority: Medium

  @happy-path @smoke
  Scenario: Select a specific page element
    When user clicks the element select button
    Then element selection mode is activated
    And a crosshair cursor appears
    And an instruction tooltip shows "Click on an element to select it"
    When user hovers over a page element
    Then the element is highlighted with an outline
    When user clicks on the element
    Then the element is selected
    And element information is captured
    And element selection mode deactivates

  @element-info
  Scenario: View selected element information
    When user selects a page element
    Then the modal shows the element type (e.g., "button", "div", "input")
    And the modal shows the element's CSS selector
    And the modal shows the element's text content (if any)

  @multiple
  Scenario: Select multiple elements
    When user clicks the element select button
    And user selects element A
    Then element A is highlighted
    When user clicks the element select button again
    And user selects element B
    Then both element A and element B are highlighted
    And information about both elements is captured

  @deselect
  Scenario: Deselect an element
    When user selects a page element
    Then the element is highlighted
    When user clicks the remove element button
    Then the element highlight is removed
    And the element information is cleared

  @cancel
  Scenario: Cancel element selection mode
    When user clicks the element select button
    Then element selection mode is activated
    When user presses the Escape key
    Then element selection mode deactivates
    And no element is selected
    And the cursor returns to normal

  @overlay
  Scenario: Element selection works with overlay visible
    When user clicks the element select button
    Then the feedback modal minimizes or becomes semi-transparent
    And user can access all page elements
    When user selects an element
    Then the feedback modal returns to normal
    And the selected element info is displayed

  @nested
  Scenario: Select nested elements precisely
    Given the page has deeply nested elements
    When user clicks the element select button
    And user holds the mouse over a nested element
    Then only the innermost element is highlighted
    When user clicks
    Then the innermost element is selected

  @keyboard @accessibility
  Scenario: Navigate element selection with keyboard
    When user activates element selection mode
    And user presses Tab to navigate
    Then elements are highlighted in tab order
    When user presses Enter on a highlighted element
    Then that element is selected

  @screenshot-integration @integration
  Scenario: Selected element appears in screenshot
    When user selects a page element
    Then the element is highlighted
    When user captures a screenshot
    Then the screenshot includes the element highlight overlay
    And the element is visually emphasized in the screenshot

  @clear-all
  Scenario: Clear all selected elements
    When user selects element A
    And user selects element B
    And user selects element C
    Then 3 elements are highlighted
    When user clicks "Clear all selections"
    Then all highlights are removed
    And no elements are selected

  @element-xpath
  Scenario: Element XPath is captured
    When user selects a page element
    Then the element's XPath is captured
    And the XPath can be used to locate the element programmatically

  @fixed-elements
  Scenario: Select fixed/sticky elements
    Given the page has a fixed header
    When user clicks the element select button
    And user clicks on the fixed header
    Then the fixed header is selected
    And its position is correctly captured as "fixed"

  @iframe @edge-case
  Scenario: Handle elements inside iframes
    Given the page contains an iframe
    When user clicks the element select button
    And user hovers over an element inside the iframe
    Then the iframe boundary is indicated
    And user can select elements within the iframe

  @dynamic-elements
  Scenario: Handle dynamically added elements
    Given elements may be added dynamically
    When user clicks the element select button
    And a new element appears on the page
    Then the new element can be hovered and selected

  @form-fields
  Scenario: Select form input elements
    Given the page has a form with input fields
    When user clicks the element select button
    And user clicks on an input field
    Then the input field is selected
    And its type, name, and value are captured

  @buttons
  Scenario: Select button elements
    When user clicks the element select button
    And user clicks on a button
    Then the button is selected
    And its label text is captured

  @link-elements
  Scenario: Select link elements without navigation
    Given the page has clickable links
    When user clicks the element select button
    And user clicks on a link
    Then the link is selected but not followed
    And the link's href is captured

  @submit-with-element
  Scenario: Submit feedback with selected element
    When user selects a page element
    And user enters "This button should be more prominent" in the description
    And user clicks the submit button
    Then feedback is saved with the element information attached
    And the element selector is included in the feedback data
