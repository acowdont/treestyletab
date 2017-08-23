/* ***** BEGIN LICENSE BLOCK ***** 
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Tree Style Tab.
 *
 * The Initial Developer of the Original Code is YUKI "Piro" Hiroshi.
 * Portions created by the Initial Developer are Copyright (C) 2011-2017
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s): YUKI "Piro" Hiroshi <piro.outsider.reflex@gmail.com>
 *                 wanabe <https://github.com/wanabe>
 *                 Tetsuharu OHZEKI <https://github.com/saneyuki>
 *                 Xidorn Quan <https://github.com/upsuper> (Firefox 40+ support)
 *                 lv7777 (https://github.com/lv7777)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ******/

var kSELECTOR_LIVE_TAB = `li.tab:not(.${kTAB_STATE_REMOVING})`;
var kSELECTOR_NORMAL_TAB = `${kSELECTOR_LIVE_TAB}:not(.hidden):not(.pinned)`;
var kSELECTOR_VISIBLE_TAB = `${kSELECTOR_LIVE_TAB}:not(.${kTAB_STATE_COLLAPSED}):not(.hidden)`;
var kSELECTOR_CONTROLLABLE_TAB = `${kSELECTOR_LIVE_TAB}:not(.hidden)`;
var kSELECTOR_PINNED_TAB = `${kSELECTOR_LIVE_TAB}.pinned`;

var kXPATH_LIVE_TAB = `[${hasClass('tab')}][not(${hasClass(kTAB_STATE_REMOVING)})]`;
var kXPATH_NORMAL_TAB = `${kXPATH_LIVE_TAB}[not(${hasClass('hidden')})][not(${hasClass('pinned')})]`;
var kXPATH_VISIBLE_TAB = `${kXPATH_LIVE_TAB}[not(${hasClass(kTAB_STATE_COLLAPSED)})][not(${hasClass('hidden')})]`;
var kXPATH_CONTROLLABLE_TAB = `${kXPATH_LIVE_TAB}[not(${hasClass('hidden')})]`;
var kXPATH_PINNED_TAB = `${kXPATH_LIVE_TAB}[${hasClass('pinned')}]`;

// basics

function getTabsContainer(aHint) {
  if (!aHint)
    aHint = gAllTabs.firstChild;

  if (typeof aHint == 'number')
    return document.querySelector(`#window-${aHint}`);

  if (aHint && typeof aHint == 'object' && 'windowId' in aHint)
    return document.querySelector(`#window-${aHint.windowId}`);

  var tab = getTabFromChild(aHint);
  if (tab)
    return tab.parentNode;

  return null;
}

function getTabFromChild(aNode) {
  if (!aNode)
    return null;
  return evaluateXPath(
    `ancestor-or-self::xhtml:li${kXPATH_LIVE_TAB}`,
    aNode,
    XPathResult.FIRST_ORDERED_NODE_TYPE
  ).singleNodeValue;
}

function getTabById(aIdOrInfo) {
  if (!aIdOrInfo)
    return null;
  if (typeof aIdOrInfo == 'string')
    aIdOrInfo = `${kSELECTOR_LIVE_TAB}#${aIdOrInfo}`;
  else
    aIdOrInfo = `${kSELECTOR_LIVE_TAB}#tab-${aIdOrInfo.window}-${aIdOrInfo.tab}`;
  return document.querySelector(aIdOrInfo);
}

function getNextTab(aTab) {
  return document.querySelector(`#${aTab.id} ~ ${kSELECTOR_LIVE_TAB}`);
}

function getPreviousTab(aTab) {
  return evaluateXPath(
    `preceding-sibling::xhtml:li${kXPATH_LIVE_TAB}`,
    aTab,
    XPathResult.FIRST_ORDERED_NODE_TYPE
  ).singleNodeValue;
}

function getFirstTab(aHint) {
  var container = getTabsContainer(aHint);
  return container && container.querySelector(kSELECTOR_LIVE_TAB);
}

function getLastTab(aHint) {
  var container = getTabsContainer(aHint);
  if (!container)
    return null;
  return evaluateXPath(
    `child::xhtml:li${kXPATH_LIVE_TAB}[last()]`,
    container,
    XPathResult.FIRST_ORDERED_NODE_TYPE
  ).singleNodeValue;
}

function getTabIndex(aTab) {
  return evaluateXPath(
    `count(preceding-sibling::xhtml:li${kXPATH_LIVE_TAB})`,
    aTab,
    XPathResult.NUMBER_TYPE
  ).numberValue;
}


// tree basics

function getParentTab(aChild) {
  var id = aChild.getAttribute(kPARENT);
  if (id)
    return aChild.parentNode.querySelector(`${kSELECTOR_LIVE_TAB}#${id}`);
  return null;
}

function getAncestorTabs(aDecendant) {
  var ancestors = [];
  while (true) {
    let parent = getParentTab(aDecendant);
    if (parent)
      ancestors.push(parent);
    else
      break;
  }
  return ancestors;
}

function getRootTab(aDecendant) {
  var ancestors = getAncestorTabs(aDecendant);
  return ancestors.length > 0 ? ancestors[ancestors.length-1] : aDecendant ;
}

function getSiblingTabs(aTab) {
  var parentId = aTab.getAttribute(kPARENT);
  if (!parentId)
    return getRootTabs(aTab);
  return aTab.parentNode.querySelector(`${kSELECTOR_LIVE_TAB}[${kPARENT}="${parentId}"]`);
}

function getNextSiblingTab(aTab) {
  var parentId = aTab.getAttribute(kPARENT);
  var parentCondition = parentId ? `[${kPARENT}="${parentId}"]` : `:not([${kPARENT}])` ;
  return aTab.parentNode.querySelector(`#${aTab.id} ~ ${kSELECTOR_LIVE_TAB}${parentCondition}`);
}

function getPreviousSiblingTab(aTab) {
  var parentId = aTab.getAttribute(kPARENT);
  var parentCondition = parentId ? `[@${kPARENT}="${parentId}"]` : `[not(@${kPARENT})]` ;
  return evaluateXPath(
    `preceding-sibling::xhtml:li${kXPATH_LIVE_TAB}${parentCondition}`,
    aTab,
    XPathResult.FIRST_ORDERED_NODE_TYPE
  ).singleNodeValue;
}

function hasChildTabs(aParent) {
  return aParent.getAttribute(kCHILDREN) != '|';
}

function getChildTabs(aParent) {
  return Array.slice(aParent.parentNode.querySelectorAll(`${kSELECTOR_LIVE_TAB}[${kPARENT}="${aParent.id}"]`));
}

function getFirstChildTab(aParent) {
  return aParent.parentNode.querySelector(`${kSELECTOR_LIVE_TAB}[${kPARENT}="${aParent.id}"`);
}

function getLastChildTab(aParent) {
  return evaluateXPath(
    `following-sibling::xhtml:li${kXPATH_LIVE_TAB}[@${kPARENT}="${parentId}"][last()]`,
    aTab,
    XPathResult.FIRST_ORDERED_NODE_TYPE
  ).singleNodeValue;
}

function getChildTabIndex(aChild, aParent) {
  return evaluateXPath(
    `count(preceding-sibling::xhtml:li${kXPATH_CONTROLLABLE_TAB}[@${kPARENT}="${aParent.id}"])`,
    aChild,
    XPathResult.NUMBER_TYPE
  ).numberValue;
}

function getDescendantTabs(aRoot) {
  var descendants = [];
  if (!aRoot)
    return descendants;
  for (let child of getChildTabs(aRoot)) {
    descendants.push(child);
    descendants = descendants.concat(getDescendantTabs(child));
  }
  return descendants;
}

function getLastDescendantTab(aRoot) {
  var descendants = getDescendantTabs(aRoot);
  return descendants.length ? descendants[descendants.length-1] : null ;
}


// grab tags

function getAllTabs(aHint) {
  var container = getTabsContainer(aHint);
  if (!container)
    return [];
  return Array.slice(container.querySelectorAll(kSELECTOR_LIVE_TAB));
}

function getTabs(aHint) { // only visible, including collapsed and pinned
  var container = getTabsContainer(aHint);
  if (!container)
    return [];
  return Array.slice(container.querySelectorAll(kSELECTOR_CONTROLLABLE_TAB));
}

function getNormalTabs(aHint) { // only visible, including collapsed, not pinned
  var container = getTabsContainer(aHint);
  if (!container)
    return [];
  return Array.slice(container.querySelectorAll(kSELECTOR_NORMAL_TAB));
}

function getVisibleTabs(aHint) { // visible, not-collapsed, not-hidden
  var container = getTabsContainer(aHint);
  if (!container)
    return [];
  return Array.slice(container.querySelectorAll(kSELECTOR_VISIBLE_TAB));
}

function getPinnedTabs(aHint) { // visible, pinned
  var container = getTabsContainer(aHint);
  if (!container)
    return [];
  return Array.slice(container.querySelectorAll(kSELECTOR_PINNED_TAB));
}

function countPinnedTabs(aHint) {
  var container = getTabsContainer(aHint);
  if (!container)
    return 0;
  return container.querySelectorAll(kSELECTOR_PINNED_TAB).length;
}

function getAllRootTabs(aHint) {
  var container = getTabsContainer(aHint);
  return container.querySelector(`${kSELECTOR_LIVE_TAB}:not([${kPARENT}])`);
}

function getRootTabs(aHint) {
  var container = getTabsContainer(aHint);
  return container.querySelector(`${kSELECTOR_CONTROLLABLE_TAB}:not([${kPARENT}])`);
}

function getVisibleRootTabs(aHint) {
  var container = getTabsContainer(aHint);
  return container.querySelector(`${kSELECTOR_VISIBLE_TAB}:not([${kPARENT}])`);
}


// misc.

function getFirstNormalTab(aHint) { // visible, not-collapsed, not-pinned
  var container = getTabsContainer(aHint);
  return container && container.querySelector(kSELECTOR_NORMAL_TAB);
}

function getLastVisibleTab(aHint) { // visible, not-collapsed, not-hidden
  var container = getTabsContainer(aHint);
  if (!container)
    return null;
  return evaluateXPath(
    `child::xhtml:li${kXPATH_VISIBLE_TAB}[last()]`,
    container,
    XPathResult.FIRST_ORDERED_NODE_TYPE
  ).singleNodeValue;
}

function getNextVisibleTab(aTab) { // visible, not-collapsed
  return document.querySelector(`#${aTab.id} ~ ${kSELECTOR_VISIBLE_TAB}`);
}

function getPreviousVisibleTab(aTab) { // visible, not-collapsed
  return evaluateXPath(
    `preceding-sibling::xhtml:li${kXPATH_VISIBLE_TAB}`,
    aTab,
    XPathResult.FIRST_ORDERED_NODE_TYPE
  ).singleNodeValue;
}

function getVisibleIndex(aTab) {
  return evaluateXPath(
    `count(preceding-sibling::xhtml:li${kXPATH_VISIBLE_TAB})`,
    aTab,
    XPathResult.NUMBER_TYPE
  ).numberValue;
}

async function doAndGetNewTabs(aAsyncTask, aHint) {
  var tabsQueryOptions = {
    windowType: ['normal']
  };
  if (aHint) {
    let container = getTabsContainer(aHint);
    if (container)
      tabsQueryOptions.windowId = container.windowId;
  }
  var beforeTabs = await browser.tabs.query(tabsQueryOptions);
  await aAsyncTask;
  var afterTabs = await browser.tabs.query(tabsQueryOptions);
  var beforeIds = beforeTabs.map(aApiTab => aApiTab.id);
  var addedTabs = afterTabs.filter(aApiTab => beforeIds.indexOf(aApiTab.id) > -1);
  return addedTabs.map(aApiTab => getTabById({ tab: aApiTab.id, window: aApiTab.windowId }));
}


// from event

function getTabFromEvent(aEvent) {
  return getTabFromChild(aEvent.target);
}

function getNewTabButtonFromEvent(aEvent) {
  return evaluateXPath(
    `ancestor-or-self::*[${hasClass('newtab-button')}][1]`,
    aEvent.originalTarget,
    XPathResult.FIRST_ORDERED_NODE_TYPE
  ).singleNodeValue;
}
