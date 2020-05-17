import { NumberTree } from './obj';

class MarkedContentInfo {
  /**
   * @param {Catalog} catalog document catalog associated with the
   *   marked-content
   */
  constructor(catalog) {
    this._catalog = catalog;
    this._hasMarkedInfo = catalog.isMarked;
  }

  /**
   * @private
   */
  _getInfoForStructParent(structParent) {
    if (!this._infoNumberTree) {
      const structTreeRoot = this._catalog.structTreeRoot;
      // Based on 14.7.2 of the spec, this will be a number tree
      // pairing StructParent(s) values to marked content info.
      // We will use this to lazily fetch info
      const parentTree = structTreeRoot.get('ParentTree');
      this._infoNumberTree = new NumberTree(parentTree, parentTree.xref);
    }

    return this._infoNumberTree.get(structParent);
  }

  /**
   * @private
   * @param {number} pageIndex index of the page (0 indexed)
   * @return {number} the structParent of the page referenced
   */
  _getStructParentFromPageIndex(pageIndex) {
    const pagesRef = this._catalog.catDict.get('Pages');
    const pages = this._fetchRef(pagesRef);
    const pagesKids = pages.get('Kids');
    const pageRef = pagesKids[pageIndex];
    const page = this._fetchRef(pageRef);
    const structParent = page.get('StructParents');

    return structParent;
  }

  /**
   * @private
   */
  _fetchRef(ref) {
    return this._catalog.xref.fetchIfRef(ref);
  }

  /**
   * Convenience method for retrieving marked-content information
   *
   * @param {number} pageIndex the index of the page associated with the
   * content. See 7.7.3.3 of the spec for more info.
   * @param {number} mcid marked-content identifier referenced as an MCID
   * in streams. See 14.7.4.2 of the spec for more info.
   * @return {*|undefined} the entry in the dict of the referenced
   * marked-content
   */
  getMarkedInfoDict(pageIndex, mcid) {
    if (!this._hasMarkedInfo) {
      throw new Error(
        'attempting to retrieve marked info in a PDF without marked content'
      );
    }

    const structParent = this._getStructParentFromPageIndex(pageIndex);
    const markedContentArray = this._getInfoForStructParent(structParent);
    const ref = markedContentArray[mcid];

    const markedInfoDict = this._fetchRef(ref);

    return markedInfoDict;
  }
}

export default MarkedContentInfo;
